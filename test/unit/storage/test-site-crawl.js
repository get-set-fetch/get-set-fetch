const sinon = require('sinon');

const connections = gsfRequire('test/config/connections.json');
const Storage = gsfRequire('lib/storage/Storage');
const GetSetFetch = gsfRequire('lib/index.js');

connections.forEach((conn) => {
  describe(`Test Site Crawl, using connection ${conn.info}`, () => {
    let Site = null;
    let Resource = null;

    before(async () => {
      ({ Site, Resource } = await Storage.init(conn));
    });

    beforeEach(async () => {
      // cleanup
      await Site.delAll();

      // save site
      const site = new Site('siteA', 'http://siteA');
      site.plugins = [
        new GetSetFetch.plugins.SelectResourcePlugin(),
        new GetSetFetch.plugins.UpdateResourcePlugin(),
      ];
      await site.save();
    });

    after(() => {
      Storage.close();
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
  });
});
