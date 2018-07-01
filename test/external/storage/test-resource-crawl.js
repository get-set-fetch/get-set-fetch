require('chai/register-assert');

function testResourceCrawl(GetSetFetch, PluginManager, Storage, conn, ResourceFncs) {
  describe(`Test Storage Resource - Crawl, using connection ${conn.info}`, () => {
    let Site = null;
    let Resource = null;
    let site = null;

    before(async () => {
      ({ Site, Resource } = await Storage.init(conn));
      await Site.delAll();
      site = new Site('siteA', 'http://siteA');
      await site.save();
    });

    beforeEach(async () => {
      // cleanup
      await Resource.delAll();
    });

    after(async () => {
      await Storage.close();
    });


    it('getResourceToCrawl without crawlFrequency', async () => {
      const resourceUrl = 'http://siteA/resourceA';

      // save a not crawled resource
      const resource = new Resource(site.id, resourceUrl);
      await resource.save();

      // getResourceToCrawl returns a resource with a crawledAt value of null
      let notCrawledResource = await Resource.getResourceToCrawl(site.id);
      assert.strictEqual(notCrawledResource.url, resourceUrl);
      ResourceFncs.checkInitialCrawledAt(notCrawledResource.crawledAt);

      // mark the resource as crawled
      await resource.update();

      // getResourceToCrawl finds no resource with crawledAt value of null
      notCrawledResource = await Resource.getResourceToCrawl(site.id);
      assert.isNull(notCrawledResource);
    });

    it('getResourceToCrawl with crawlFrequency', async () => {
      const resourceUrl = 'http://siteA/resourceA';

      // save a not crawled resource
      let resource = new Resource(site.id, resourceUrl);
      await resource.save();

      // getResourceToCrawl returns resource with a crawledAt value of null
      const notCrawledResource = await Resource.getResourceToCrawl(site.id, 1);
      assert.strictEqual(notCrawledResource.url, resourceUrl);
      ResourceFncs.checkInitialCrawledAt(notCrawledResource.crawledAt);

      // how many hours ago was the last crawl
      const deltaHours = 2;

      // update crawlAt value and re-fetch the resource
      await ResourceFncs.updateCrawledAt(Resource, resource.id, deltaHours);
      resource = await Resource.get(resource.id);

      // getResourceToCrawl returns an expired resource
      await ResourceFncs.resetCrawlInProgress(Resource, resource.id);
      let expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours - 1);
      assert.strictEqual(expiredResource.url, resourceUrl);
      assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

      // getResourceToCrawl returns an expired resource
      await ResourceFncs.resetCrawlInProgress(Resource, resource.id);
      expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours);
      assert.strictEqual(expiredResource.url, resourceUrl);
      assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

      // getResourceToCrawl returns null, there are no crawled and expired resources
      await ResourceFncs.resetCrawlInProgress(Resource, resource.id);
      expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours + 1);
      assert.isNull(expiredResource);
    });
  });
}

module.exports = testResourceCrawl;
