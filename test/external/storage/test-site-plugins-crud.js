require('chai/register-assert');

function testSitePluginsCrud(GetSetFetch, PluginManager, Storage, conn) {
  describe(`Test Storage Site Plugins - CRUD, using connection ${conn.info}`, () => {
    let Site = null;
    let site = null;
    const { BasePlugin } = GetSetFetch.plugins;

    before(async () => {
      ({ Site } = await Storage.init(conn));
    });

    beforeEach(async () => {
      PluginManager.reset();
      PluginManager.registerDefaults();

      // cleanup
      await Site.delAll();

      // save site
      site = new Site('siteA', 'http://www.site1.com/index.html', { 'User-Agent': 'custom-user-agent' });
      await site.save();
    });

    after(async () => {
      await Storage.close();
    });

    it('get default plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // check number of default saved plugins
      assert.strictEqual(PluginManager.DEFAULT_PLUGINS.length, siteById.getPlugins().length);

      // check if plugins json content has been correctly transformed to plugin instances
      const expectedPluginNames = PluginManager.DEFAULT_PLUGINS.map(plugin => plugin.constructor.name);
      siteById.getPlugins().forEach((pluginInstance) => {
        assert.instanceOf(pluginInstance, BasePlugin);
        assert.include(expectedPluginNames, pluginInstance.constructor.name);
      });
    });

    it('set valid plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // set valid plugins
      siteById.setPlugins([
        new GetSetFetch.plugins.SelectResourcePlugin(),
        new GetSetFetch.plugins.NodeFetchPlugin(),
      ]);
      assert.strictEqual(2, siteById.getPlugins().length);
      const expectedPluginNames = ['SelectResourcePlugin', 'NodeFetchPlugin'];
      siteById.getPlugins().forEach((pluginInstance) => {
        assert.include(expectedPluginNames, pluginInstance.constructor.name);
      });
    });

    it('set invalid plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // set invalid plugins
      assert.throws(
        siteById.setPlugins.bind(siteById, [{ prop: 'not a plugin' }]),
        Error,
        /Invalid plugin instance/,
      );
    });

    it('add valid plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // add valid plugins
      siteById.addPlugins([
        new GetSetFetch.plugins.PersistResourcePlugin(),
        new GetSetFetch.plugins.SelectResourcePlugin(),
      ]);
      // 7 default plugins + 1 new one, SelectResourcePlugin just replaces the existing instance
      assert.strictEqual(PluginManager.DEFAULT_PLUGINS.length + 1, siteById.getPlugins().length);
      const expectedPluginNames = PluginManager.DEFAULT_PLUGINS.map(plugin => plugin.constructor.name);
      expectedPluginNames.push('PersistResourcePlugin');
      siteById.getPlugins().forEach((pluginInstance) => {
        assert.include(expectedPluginNames, pluginInstance.constructor.name);
      });
    });

    it('add invalid plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // add invalid plugins
      assert.throws(
        siteById.addPlugins.bind(siteById, [{ prop: 'not a plugin' }]),
        Error,
        /Invalid plugin instance/,
      );
    });

    it('remove plugins', async () => {
      // load site from id
      const siteById = await Site.get('siteA');

      // remove plugins
      siteById.removePlugins([
        GetSetFetch.plugins.SelectResourcePlugin.name,
        GetSetFetch.plugins.UpdateResourcePlugin.name,
      ]);
      // 7 default plugins -2 removed
      assert.strictEqual(PluginManager.DEFAULT_PLUGINS.length - 2, siteById.getPlugins().length);
    });
  });
}

module.exports = testSitePluginsCrud;
