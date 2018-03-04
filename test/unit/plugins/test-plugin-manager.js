require('chai/register-assert');

const PluginManager = require.main.require('lib/plugins/PluginManager');
const SelectResourcePlugin = require.main.require('lib/plugins/select/SelectResourcePlugin');

describe('Test Plugin Manager', () => {
  beforeEach(() => {
    PluginManager.reset();
    PluginManager.registerDefaults();
  });

  it('builtin default plugin registration', async () => {
    assert.strictEqual(7, PluginManager.constructorMap.size);

    const expectedPlugins = [
      'SelectResourcePlugin',
      'NodeFetchPlugin',
      'JsDomPlugin',
      'ExtractUrlPlugin',
      'RobotsFilterPlugin',
      'UpdateResourcePlugin',
      'InsertResourcePlugin',
    ];
    expectedPlugins.forEach((expectedPlugin) => {
      assert.isTrue(PluginManager.constructorMap.has(expectedPlugin), `default plugin not present: ${expectedPlugin}`);
    });
  });

  it('register external plugin', async () => {
    class ExternalPlugin {}
    const pluginInstance = new ExternalPlugin();
    PluginManager.register(pluginInstance);
    assert.strictEqual(7 + 1, PluginManager.constructorMap.size);
    assert.isTrue(PluginManager.constructorMap.has('ExternalPlugin'));
  });

  it('instantiate default plugin', async () => {
    const pluginOpts = { propA: 'valA' };
    const pluginInstance = PluginManager.instantiate({ name: 'SelectResourcePlugin', opts: pluginOpts });
    assert.instanceOf(pluginInstance, SelectResourcePlugin);
    assert.strictEqual(pluginInstance.opts.propA, 'valA');
  });
});

