require('chai/register-assert');
const fs = require('fs');

const connections = require.main.require('test/config/connections.json');
const TestUtils = require.main.require('test/utils/TestUtils');
const GetSetFetch = require.main.require('lib/index.js');

connections.forEach((conn) => {
  /*
  pages:
    index.html contains links to: pageA.html
    pageA.html contains links to: pageA.html, pageB.html
    pageB.html contains links to: pageA.html, pageB.html, extra/pageC.html
    extra/pageC.html contains links to: pageA.html, extra/pageD.html

    robots.txt restricts crawling of ./extra subdir
  */
  describe(`Test Crawl Site - default plugins, using connection ${conn.info}`, () => {
    let Site = null;
    let site = null;

    before(async () => {
      ({ Site } = await GetSetFetch.init(conn));
    });

    beforeEach(async () => {
      // cleanup
      await Site.delAll();

      // save site
      site = new Site('siteA', 'http://www.site1.com/index.html', { 'User-Agent': 'custom-user-agent' });
      await site.save();

      // configure nock to serve fs files
      TestUtils.fs2http('test/integration/crawl-site-default-plugin', 'http://www.site1.com');

      // fetch and save robots.txt
      await site.fetchRobots();
      assert.strictEqual(String(fs.readFileSync('test/integration/crawl-site-default-plugin/robots.txt')), site.robotsTxt);
    });

    after(() => {
      GetSetFetch.close();
    });

    it('crawl resource - index.html, 1st page, depth 0', async () => {
      // crawl index.html
      const resource = await site.crawlResource();

      // verify resource raw data
      assert.strictEqual(String(fs.readFileSync('test/integration/crawl-site-default-plugin/index.html')), resource.rawData);

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

      // verify resource raw data
      assert.strictEqual(String(fs.readFileSync('test/integration/crawl-site-default-plugin/pageA.html')), resource.rawData);

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

      // verify resource raw data
      assert.strictEqual(String(fs.readFileSync('test/integration/crawl-site-default-plugin/pageB.html')), resource.rawData);

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
