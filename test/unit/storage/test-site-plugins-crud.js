require('chai/register-assert');

const connections = require.main.require('test/config/connections.json');
const Storage = require.main.require('lib/storage/Storage');
const BasePlugin = require.main.require('lib/plugins/base/BasePlugin');
const PluginManager = require.main.require('lib/plugins/PluginManager');

connections.forEach((conn) => {
  describe(`Test Storage Site Plugins - CRUD, using connection ${conn.info}`, () => {
    let Site = null;
    let site = null;

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

    after(() => {
      Storage.close();
    });

    it('default plugins', async () => {
      // load site from id
      const siteById1 = await Site.get('siteA');

      // check number of default saved plugins
      assert.strictEqual(7, siteById1.plugins.length);

      // check if plugins json content has been correctly transformed to plugin instances
      const expectedPlugins = PluginManager.DEFAULT_PLUGINS.map(plugin => plugin.constructor.name);
      site.plugins.forEach((pluginInstance) => {
        assert.instanceOf(pluginInstance, BasePlugin);
        assert.include(expectedPlugins, pluginInstance.constructor.name);
      });
    });
  });
});
