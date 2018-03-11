require('chai/register-assert');

const connections = gsfRequire('test/config/connections.json');

const Storage = gsfRequire('lib/storage/Storage');

connections.forEach((conn) => {
  describe(`Test Storage Resource - CRUD, using connection ${conn.info}`, () => {
    let Site = null;
    let Resource = null;
    const expectedResource = { id: null, siteId: null, url: 'http://siteA/resourceA' };

    before(async () => {
      ({ Site, Resource } = await Storage.init(conn));
      await Site.delAll();
      const site = new Site('siteA', 'http://siteA');
      await site.save();
      expectedResource.siteId = site.id;
    });

    beforeEach(async () => {
      // cleanup
      await Resource.delAll();

      // save resource
      const resource = new Resource(expectedResource.siteId, expectedResource.url);
      await resource.save();
      assert.isNotNull(resource.id);
      expectedResource.id = resource.id;
    });

    after(() => {
      Storage.close();
    });

    it('get', async () => {
      // get resource by id
      const resourceById = await Resource.get(expectedResource.id);
      assert.instanceOf(resourceById, Resource);
      assert.strictEqual(String(expectedResource.siteId), String(resourceById.siteId));
      assert.strictEqual(expectedResource.url, resourceById.url);

      // get resource by url
      const resourceByUrl = await Resource.get(expectedResource.url);
      assert.instanceOf(resourceByUrl, Resource);
      assert.strictEqual(String(expectedResource.id), String(resourceByUrl.id));
      assert.strictEqual(String(expectedResource.siteId), String(resourceByUrl.siteId));
    });

    it('update', async () => {
      // update resource
      const updateResource = await Resource.get(expectedResource.id);
      updateResource.url = 'http://siteA/resourceA_updated';
      await updateResource.update();

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.strictEqual(String(expectedResource.siteId), String(getResource.siteId));
      assert.strictEqual(updateResource.url, getResource.url);
    });

    it('delete', async () => {
      // delete site
      const delResource = await Resource.get(expectedResource.id);
      await delResource.del();

      // get and compare
      const getResource = await Resource.get(expectedResource.id);
      assert.isNull(getResource);
    });
  });
});
