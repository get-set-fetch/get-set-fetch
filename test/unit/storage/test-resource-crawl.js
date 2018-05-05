require('chai/register-assert');

const connections = gsfRequire('test/config/connections.json');
const Storage = gsfRequire('lib/storage/Storage');

connections.forEach((conn) => {
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

    function updateCrawledAt(resourceId, deltaHours) {
      if (Resource.knex) {
        const dbClient = Resource.knex.client.config.client;
        let rawTimeQuery = null;
        switch (dbClient) {
          case 'mysql':
          case 'pg':
            rawTimeQuery = Resource.knex.raw(`NOW() - INTERVAL '${deltaHours}' HOUR`);
            break;
          case 'sqlite3':
            rawTimeQuery = Resource.knex.raw(`datetime('now','-${deltaHours} hour')`);
            break;
          default:
            rawTimeQuery = null;
        }

        return rawTimeQuery ? Resource.builder.where('id', resourceId).update('crawledAt', rawTimeQuery) : null;
      }

      if (Resource.mongo) {
        return Resource.builder.update(
          { _id: resourceId },
          {
            $set: {
              crawledAt: new Date(Date.now() - (deltaHours * 60 * 60 * 1000)),
            },
          },
        );
      }

      return null;
    }

    function resetCrawlInProgress(resourceId) {
      if (Resource.knex) {
        return Resource.builder.where('id', resourceId)
          .update({ crawlInProgress: false });
      }

      if (Resource.mongo) {
        return Resource.builder.update(
          { _id: resourceId },
          {
            $set: {
              crawlInProgress: false,
            },
          },
        );
      }

      return null;
    }

    it('getResourceToCrawl without crawlFrequency', async () => {
      const resourceUrl = 'http://siteA/resourceA';

      // save a not crawled resource
      const resource = new Resource(site.id, resourceUrl);
      await resource.save();

      // getResourceToCrawl returns a resource with a crawledAt value of null
      let notCrawledResource = await Resource.getResourceToCrawl(site.id);
      assert.strictEqual(notCrawledResource.url, resourceUrl);
      assert.isNull(notCrawledResource.crawledAt);

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
      assert.isNull(notCrawledResource.crawledAt);

      // how many hours ago was the last crawl
      const deltaHours = 2;

      // update crawlAt value and re-fetch the resource
      await updateCrawledAt(resource.id, deltaHours);
      resource = await Resource.get(resource.id);

      // getResourceToCrawl returns an expired resource
      await resetCrawlInProgress(resource.id);
      let expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours - 1);
      assert.strictEqual(expiredResource.url, resourceUrl);
      assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

      // getResourceToCrawl returns an expired resource
      await resetCrawlInProgress(resource.id);
      expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours);
      assert.strictEqual(expiredResource.url, resourceUrl);
      assert.deepEqual(expiredResource.crawledAt, resource.crawledAt);

      // getResourceToCrawl returns null, there are no crawled and expired resources
      await resetCrawlInProgress(resource.id);
      expiredResource = await Resource.getResourceToCrawl(site.id, deltaHours + 1);
      assert.isNull(expiredResource);
    });
  });
});
