require('chai/register-assert');

const connections = gsfRequire('test/config/connections.json');
const Storage = gsfRequire('lib/storage/Storage');

connections.forEach((conn) => {
  describe(`Test Storage Site - CRUD, using connection ${conn.info}`, () => {
    let Site = null;
    const expectedSite = {
      id: null, name: 'siteA', url: 'http://siteA', requestHeaders: { 'User-Agent': 'custom-user-agent' },
    };

    before(async () => {
      ({ Site } = await Storage.init(conn));
    });

    beforeEach(async () => {
      // cleanup
      await Site.delAll();

      // save site
      const site = new Site(expectedSite.name, expectedSite.url, expectedSite.requestHeaders);
      await site.save();
      assert.isNotNull(site.id);
      expectedSite.id = site.id;
    });

    after(() => {
      Storage.close();
    });

    it('get', async () => {
      // get site by id
      const siteById = await Site.get(expectedSite.id);
      assert.instanceOf(siteById, Site);
      assert.strictEqual(expectedSite.name, siteById.name);
      assert.strictEqual(expectedSite.url, siteById.url);
      assert.deepEqual(expectedSite.requestHeaders, siteById.requestHeaders);

      // get site by name
      const siteByName = await Site.get(expectedSite.name);
      assert.instanceOf(siteByName, Site);
      assert.strictEqual(String(expectedSite.id), String(siteByName.id));
      assert.strictEqual(expectedSite.url, siteByName.url);
      assert.deepEqual(expectedSite.requestHeaders, siteByName.requestHeaders);
    });

    it('update', async () => {
      // update site
      const updateSite = await Site.get(expectedSite.id);
      updateSite.name = 'siteA_updated';
      updateSite.url = 'http://siteA/updated';
      updateSite.requestHeaders = { 'User-Agent': 'custom-user-agent-update' };
      await updateSite.update();

      // get and compare
      const getSite = await Site.get(expectedSite.id);
      assert.strictEqual(updateSite.name, getSite.name);
      assert.strictEqual(updateSite.url, getSite.url);
      assert.deepEqual(updateSite.requestHeaders, getSite.requestHeaders);
    });

    it('delete', async () => {
      // delete site
      const delSite = await Site.get(expectedSite.id);
      await delSite.del();

      // get and compare
      const getSite = await Site.get(expectedSite.id);
      assert.isNull(getSite);
    });
  });
});
