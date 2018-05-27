const sinon = require('sinon');
const nock = require('nock');

function testSiteCrawl(GetSetFetch, Storage, conn) {
  describe(`Test Site Crawl, using connection ${conn.info}`, () => {
    let Site = null;
    let Resource = null;
    const { PluginManager } = GetSetFetch;

    before(async () => {
      ({ Site, Resource } = await Storage.init(conn));
    });

    beforeEach(async () => {
      // cleanup
      await Site.delAll();

      // save site
      const site = new Site('siteA', 'http://siteA/page-0.html');
      site.setPlugins([
        new GetSetFetch.plugins.SelectResourcePlugin(),
        new GetSetFetch.plugins.UpdateResourcePlugin(),
      ]);
      await site.save();
    });

    after(async () => {
      await Storage.close();
    });

    it('default sequential crawl, 5 resources', async () => {
      const site = await Site.get('siteA');

      // save 4 additional resources, an initial resource is created when the site is created
      for (let i = 1; i <= 4; i += 1) {
        const resource = new Resource(site.id, `url-${i}`);
        await resource.save();
      }
      const crawlResourceSpy = sinon.spy(site, 'crawlResource');
      await site.crawl();

      /*
      re-opening 1 connection(s)
      resource http://siteA crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-1 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-2 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-3 crawled, connActive: 0
      re-opening 1 connection(s)
      resource url-4 crawled, connActive: 0
      re-opening 1 connection(s)
      no resource to crawl found, connActive: 0
      */
      sinon.assert.callCount(crawlResourceSpy, 6);
    });

    it('parallel crawl, 5 resources available from the begining, maxConnections: 2', async () => {
      const site = await Site.get('siteA');

      // save 4 additional resources, an initial resource is created when the site is created
      for (let i = 1; i <= 4; i += 1) {
        const resource = new Resource(site.id, `url-${i}`);
        await resource.save();
      }
      const crawlResourceSpy = sinon.spy(site, 'crawlResource');
      await site.crawl({ maxConnections: 2 });

      /*
      re-opening 2 connection(s)
      resource http://siteA crawled, connActive: 1
      resource url-1 crawled, connActive: 0
      re-opening 2 connection(s)
      resource url-2 crawled, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource url-4 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
      sinon.assert.callCount(crawlResourceSpy, 8);
    });

    it('parallel crawl, 5 resources available from the begining, maxConnections: 3', async () => {
      const site = await Site.get('siteA');

      // save 4 additional resources, an initial resource is created when the site is created
      for (let i = 1; i <= 4; i += 1) {
        const resource = new Resource(site.id, `url-${i}`);
        await resource.save();
      }
      const crawlResourceSpy = sinon.spy(site, 'crawlResource');
      await site.crawl({ maxConnections: 3 });

      /*
      re-opening 3 connection(s)
      resource http://siteA crawled, connActive: 2, connPending: 1
      resource url-1 crawled, connActive: 1
      resource url-2 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      resource url-3 crawled, connActive: 1
      resource url-4 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
      sinon.assert.callCount(crawlResourceSpy, 9);
    });

    /*
    a single initial resource is available
    after the initial resource is crawled, the rest of the resources are available for crawling
    */
    it('parallel crawl, 5 resources available gradually, maxConnections: 2', async () => {
      const site = await Site.get('siteA');

      // save 4 additional resources, an initial resource is created when the site is created
      for (let i = 1; i < 4; i += 1) {
        const resource = new Resource(site.id, `url-${i}`);
        await resource.save();
      }

      const crawlResourceStub = sinon.stub(site, 'crawlResource');

      // override crawlResource on 2nd call to return null - no resource found
      crawlResourceStub.onCall(1).resolves(null);
      crawlResourceStub.callThrough();

      await site.crawl({ maxConnections: 2 });

      /*
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource http://siteA crawled, connActive: 0
      re-opening 2 connection(s)
      resource url-1 crawled, connActive: 1
      resource url-2 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 2 connection(s)
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
      sinon.assert.callCount(crawlResourceStub, 8);
    });

    /*
    a single initial resource is available
    after the initial resource is crawled, the rest of the resources are available for crawling
    */
    it('parallel crawl, 5 resources available gradually, maxConnections: 3', async () => {
      const site = await Site.get('siteA');

      // save 4 additional resources, an initial resource is created when the site is created
      for (let i = 1; i < 4; i += 1) {
        const resource = new Resource(site.id, `url-${i}`);
        await resource.save();
      }

      const crawlResourceStub = sinon.stub(site, 'crawlResource');

      // override crawlResource on 2nd and 3rd calls to return null - no resource found
      crawlResourceStub.onCall(1).resolves(null);
      crawlResourceStub.onCall(2).resolves(null);
      crawlResourceStub.callThrough();

      await site.crawl({ maxConnections: 3 });

      /*
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      resource http://siteA crawled, connActive: 0
      re-opening 3 connection(s)
      resource url-1 crawled, connActive: 2
      resource url-2 crawled, connActive: 1
      resource url-3 crawled, connActive: 0
      re-opening 3 connection(s)
      no resource to crawl found, connActive: 2
      no resource to crawl found, connActive: 1
      no resource to crawl found, connActive: 0
      */
      sinon.assert.callCount(crawlResourceStub, 9);
    });

    it('crawl until maxDepth is reached', async () => {
      const site = await Site.get('siteA');

      // restore site crawling capabilities
      site.setPlugins(PluginManager.DEFAULT_PLUGINS);

      // mock html pages
      for (let i = 0; i < 10; i += 1) {
        nock('http://siteA')
          .persist()
          .get(`/page-${i}.html`).reply(
            200,
            `<html><body><a href="page-${i + 1}.html">depth ${i + 1}</a></body></html>`,
            {
              'Content-Type': 'text/html; charset=utf-8',
            },
          );
      }

      const crawlResourceSpy = sinon.spy(site, 'crawlResource');
      await site.crawl({ maxDepth: 3 });

      // crawl resources of depth 0-3 + failed attempt returning a null resources indicating the crawling is complete
      sinon.assert.callCount(crawlResourceSpy, 4 + 1);
    });

    it('crawl until maxResources is reached', async () => {
      const site = await Site.get('siteA');

      // restore site crawling capabilities
      site.setPlugins(PluginManager.DEFAULT_PLUGINS);

      // mock html pages
      for (let i = 0; i < 10; i += 1) {
        nock('http://siteA')
          .persist()
          .get(`/page-${i}.html`).reply(
            200,
            `<html><body><a href="page-${i + 1}.html">depth ${i + 1}</a></body></html>`,
            {
              'Content-Type': 'text/html; charset=utf-8',
            },
          );
      }

      const crawlResourceSpy = sinon.spy(site, 'crawlResource');
      await site.crawl({ maxResources: 7 });

      sinon.assert.callCount(crawlResourceSpy, 7);
    });
  });
}

module.exports = testSiteCrawl;
