require('chai/register-assert');
const fs = require('fs');
const path = require('path');

const connections = gsfRequire('test/config/connections.json');
const pluginConfigs = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');
const { Storage } = gsfRequire('lib/index.js');

connections.forEach((conn) => {
  /*
  only use plugin configurations containing the ChromeFetchPlugin,
  the only one capable of executing js and retrieving the dynamically generated dom
  */
  const chromePluginConfigs = pluginConfigs.getPlugins()
    .filter(pluginConf => pluginConf.info.indexOf('+ChromeFetchPlugin') !== -1);

  chromePluginConfigs.forEach((pluginConf) => {
    describe('Test Scenario: parse dynamic html resources - all depths\n' +
      `using db connection: ${conn.info}\n` +
      `using plugin configuration: ${pluginConf.info}`, () => {
      let Site = null;
      let Resource = null;
      let site = null;
      let nockScopes = null;

      before(async () => {
        ({ Site, Resource } = await Storage.init(conn));
      });

      beforeEach(async () => {
        // cleanup
        await Site.delAll();

        // save site
        site = new Site('siteA', 'http://www.site1.com/index.html');
        await site.save();

        // configure nock to serve fs files
        nockScopes = TestUtils.fs2http(path.join('test', 'integration', 'crawl-site-parse-dynamic-html'), 'http://www.site1.com');

        // set plugin configuration
        site.setPlugins(pluginConf.plugins);
      });

      afterEach(async () => {
        TestUtils.stopPersisting(nockScopes);

        // cleanup
        await Resource.delAll();
        await Site.delAll();
      });

      after(async () => {
        await site.cleanupPlugins();
        await Storage.close();
      });

      it('crawl dynamic content', async () => {
        // enable saving resource content and crawl all resources
        await site.crawl();

        const expectedResources = [
          {
            depth: 0,
            url: 'http://www.site1.com/index.html',
            content: String(fs.readFileSync('test/integration/crawl-site-parse-dynamic-html/index-generated.html')),
          },
          {
            depth: 1,
            url: 'http://www.site1.com/pageA.html',
            content: String(fs.readFileSync('test/integration/crawl-site-parse-dynamic-html/pageA-generated.html')),
          },
          {
            depth: 2,
            url: 'http://www.site1.com/pageB.html',
            content: String(fs.readFileSync('test/integration/crawl-site-parse-dynamic-html/pageB-generated.html')),
          },
        ];

        // verify each resource
        for (let i = 0; i < expectedResources.length; i += 1) {
          const actualResource = await Resource.get(expectedResources[i].url);

          // verify resource content
          assert.strictEqual(
            TestUtils.stripChromeExtraTags(expectedResources[i].content),
            TestUtils.stripChromeExtraTags(actualResource.content.toString()),
          );

          // verify resource depth
          assert.strictEqual(expectedResources[i].depth, actualResource.depth);
        }
      });
    });
  });
});
