require('chai/register-assert');
const path = require('path');

let connections = gsfRequire('test/config/connections.json');
const pluginConfigs = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');
const { plugins, Storage } = gsfRequire('lib/index.js');
const { BasePlugin } = plugins;

connections = [connections[1]];


connections.forEach((conn) => {
  let pluginConfigurations = pluginConfigs.getPlugins();
  pluginConfigurations = [pluginConfigurations[0]];
  pluginConfigurations.forEach((pluginConf) => {
    describe('Test Scenario: extract html headers - all depths\n' +
      `using db connection: ${conn.info}\n` +
      `using plugin configuration: ${pluginConf.info}`, () => {
      let Site = null;
      let Resource = null;
      let site = null;
      let nockScopes = null;

      before(async () => {
        // temporary fix for #28, mysql test fails indeterminately
        if (conn.client === 'mysql') {
          console.log('wait before initializing mysql connection');
          await new Promise((resolve) => {
            setTimeout(() => resolve(), 10 * 1000);
          });
        }

        ({ Site, Resource } = await Storage.init(conn));
      });

      beforeEach(async () => {
        // cleanup
        await Site.delAll();

        // save site
        site = new Site('siteA', 'http://www.site1.com/index.html');
        await site.save();

        // configure nock to serve fs files
        nockScopes = TestUtils.fs2http(
          path.join('test', 'integration', 'crawl-site-extract-html-headers'),
          'http://www.site1.com',
        );

        // set plugin configuration
        site.setPlugins(pluginConf.plugins);

        // add custom plugin for e
        class ExtractHeaderPlugin extends BasePlugin {
          // eslint-disable-next-line class-methods-use-this
          getPhase() {
            return BasePlugin.PHASE.PROCESS;
          }

          // eslint-disable-next-line class-methods-use-this
          test(resource) {
            return resource.document;
          }

          // eslint-disable-next-line
          apply(site, resource) {
            const headerElms = resource.document.getElementsByTagName('h1');
            const headers = Array.from(Object.keys(headerElms).map(key => headerElms[key].textContent));
            return { info: { headers } };
          }
        }

        site.addPlugins([new ExtractHeaderPlugin()]);
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

      it('extract html h1 elements into info property as json', async () => {
        // enable saving resource content and crawl all resources
        await site.crawl();

        const expectedResources = [
          {
            depth: 0,
            url: 'http://www.site1.com/index.html',
            info: { headers: ['Main Header'] },
          },
          {
            depth: 1,
            url: 'http://www.site1.com/pageA.html',
            info: { headers: ['PageA Header'] },
          },
          {
            depth: 2,
            url: 'http://www.site1.com/pageB.html',
            info: { headers: ['PageB Header'] },
          },
        ];

        // verify each resource
        for (let i = 0; i < expectedResources.length; i += 1) {
          const actualResource = await Resource.get(expectedResources[i].url);

          // verify info json content
          assert.deepEqual(expectedResources[i].info, actualResource.info);

          // verify resource depth
          assert.strictEqual(expectedResources[i].depth, actualResource.depth);
        }
      });
    });
  });
});
