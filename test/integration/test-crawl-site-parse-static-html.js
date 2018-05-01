require('chai/register-assert');
const fs = require('fs');
const path = require('path');

const connections = gsfRequire('test/config/connections.json');
const pluginConfigs = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');
const GetSetFetch = gsfRequire('lib/index.js');

connections.forEach((conn) => {
  const pluginConfigurations = pluginConfigs.getPlugins();
  pluginConfigurations.forEach((pluginConf) => {
    /*
    pages:
      index.html contains links to: pageA.html
      pageA.html contains links to: pageA.html, pageB.html
      pageB.html contains links to: pageA.html, pageB.html, extra/pageC.html
      extra/pageC.html contains links to: pageA.html, extra/pageD.html

      robots.txt restricts crawling of ./extra subdir
    */
    describe('Test Scenario: parse static html resources - one depth at a time\n' +
      `using db connection: ${conn.info}\n` +
      `using plugin configuration: ${pluginConf.info}`, () => {
      let Site = null;
      let Resource = null;
      let site = null;
      let nockScopes = null;

      before(async () => {
        ({ Site, Resource } = await GetSetFetch.init(conn));
      });

      beforeEach(async () => {
        // cleanup
        await Site.delAll();

        // save site
        site = new Site('siteA', 'http://www.site1.com/index.html');
        await site.save();

        // configure nock to serve fs files
        nockScopes = TestUtils.fs2http(path.join('test', 'integration', 'crawl-site-parse-static-html'), 'http://www.site1.com');

        // fetch and save robots.txt
        await site.fetchRobots();
        assert.strictEqual(String(fs.readFileSync('test/integration/crawl-site-parse-static-html/robots.txt')), site.robotsTxt);

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
        await GetSetFetch.close();
      });

      it('crawl resource - index.html, 1st page, depth 0', async () => {
        // crawl index.html
        const resource = await site.crawlResource();

        // verify resource content
        assert.strictEqual(
          TestUtils.stripChromeExtraTags(String(fs.readFileSync('test/integration/crawl-site-parse-static-html/index.html'))),
          TestUtils.stripChromeExtraTags(resource.content.toString()),
        );

        // verify jsdom instance
        assert.isFunction(resource.document.querySelectorAll);

        // verify urls to add (valid urls, including already crawled urls)
        assert.strictEqual(1, resource.urlsToAdd.length);

        // verify there are 2 resources in total now
        assert.strictEqual(2, (await site.getResourceCount()));

        /*
        verify the newly added resource:
          - has a depth of 0 + 1
          - has the correct url set
        */
        const newResource = await site.getResourceToCrawl();
        assert.strictEqual('http://www.site1.com/pageA.html', newResource.url);
        assert.strictEqual(1, newResource.depth);
      });

      it('crawl resource - pageA.html, 2nd page, depth 1', async () => {
        let resource = null;

        // keep crawling till reaching 2nd page
        // eslint-disable-next-line no-await-in-loop
        for (let i = 0; i < 2; i += 1) {
          resource = await site.crawlResource();
        }

        // verify resource content
        assert.strictEqual(
          TestUtils.stripChromeExtraTags(String(fs.readFileSync('test/integration/crawl-site-parse-static-html/pageA.html'))),
          TestUtils.stripChromeExtraTags(resource.content.toString()),
        );

        // verify jsdom instance
        assert.isFunction(resource.document.querySelectorAll);

        // verify urls to add (valid urls, including already crawled urls)
        assert.strictEqual(2, resource.urlsToAdd.length);

        // verify there are 3 resources in total now
        assert.strictEqual(3, (await site.getResourceCount()));

        /*
        verify the newly added resource:
          - has a depth of 1 + 1
          - has the correct url set
        */
        const newResource = await site.getResourceToCrawl();
        assert.strictEqual('http://www.site1.com/pageB.html', newResource.url);
        assert.strictEqual(2, newResource.depth);
      });

      it('crawl resource - pageB.html, 3rd page, depth 2', async () => {
        let resource = null;

        // keep crawling till reaching 3rd page
        // eslint-disable-next-line no-await-in-loop
        for (let i = 0; i < 3; i += 1) {
          resource = await site.crawlResource();
        }

        // verify resource content
        assert.strictEqual(
          TestUtils.stripChromeExtraTags(String(fs.readFileSync('test/integration/crawl-site-parse-static-html/pageB.html'))),
          TestUtils.stripChromeExtraTags(resource.content.toString()),
        );

        // verify jsdom instance
        assert.isFunction(resource.document.querySelectorAll);

        // verify urls to add (valid urls, including already crawled urls)
        assert.strictEqual(2, resource.urlsToAdd.length);

        // verify there are STILL 3 resources in total now, as the new links are forbidden by robots.txt
        assert.strictEqual(3, (await site.getResourceCount()));

        /* verify there are no more resources to crawl */
        const newResource = await site.getResourceToCrawl();
        assert.isNull(newResource);
      });
    });
  });
});
