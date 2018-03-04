// default plugins
const SelectResourcePlugin = require.main.require('lib/plugins/select/SelectResourcePlugin');
const NodeFetchPlugin = require.main.require('lib/plugins/fetch/NodeFetchPlugin');
const JsDomPlugin = require.main.require('lib/plugins/process/JsDomPlugin');
const ExtractUrlPlugin = require.main.require('lib/plugins/process/ExtractUrlPlugin');
const RobotsFilterPlugin = require.main.require('lib/plugins/process/RobotsFilterPlugin');
const UpdateResourcePlugin = require.main.require('lib/plugins/save/UpdateResourcePlugin');
const InsertResourcePlugin = require.main.require('lib/plugins/save/InsertResourcePlugin');

// optional plugins
const PersistResourcePlugin = require.main.require('lib/plugins/save/PersistResourcePlugin');

class PluginManager {
  static get DEFAULT_PLUGINS() {
    return [
      new SelectResourcePlugin(), // select: resource to crawl
      new NodeFetchPlugin(), // fetch: resource, follow redirects if needed
      new JsDomPlugin(), // pre-process: add jsdom property to resource
      new ExtractUrlPlugin(), // process: extract internal urls for further crawling
      new RobotsFilterPlugin(), // post-process: only allow robots.txt allowed resources to be saved, based on site.robots.txt
      new UpdateResourcePlugin(), // save: update current resource with the fetched content
      new InsertResourcePlugin(), // save: insert newly founded resources after parsing the current resource content
    ];
  }

  static reset() {
    PluginManager.constructorMap = new Map();
  }

  static register(instanceInput) {
    // handle both single element and array input
    const instancePlugins = instanceInput instanceof Array ? instanceInput : [instanceInput];

    PluginManager.constructorMap = PluginManager.constructorMap ? PluginManager.constructorMap : new Map();
    instancePlugins.forEach((instancePlugin) => {
      PluginManager.constructorMap.set(instancePlugin.constructor.name, instancePlugin.constructor);
    });
  }

  static registerDefaults() {
    PluginManager.register(PluginManager.DEFAULT_PLUGINS);
  }

  static registerOptionals() {
    PluginManager.register(PersistResourcePlugin);
  }

  static instantiate(jsonInput) {
    // handle both single element and array input
    const jsonPlugins = jsonInput instanceof Array ? jsonInput : [jsonInput];
    const instancePlugins = [];

    jsonPlugins.forEach((jsonPlugin) => {
      if (!PluginManager.constructorMap.has(jsonPlugin.name)) {
        throw new Error(`Plugin ${jsonPlugin.name} is not registered.`);
      }

      instancePlugins.push(new (PluginManager.constructorMap.get(jsonPlugin.name))(jsonPlugin.opts));
    });

    return instancePlugins.length === 1 ? instancePlugins[0] : instancePlugins;
  }

  static orderPlugins(instancePlugins) {
    return instancePlugins.sort((p1, p2) => p1.getPriority() - p2.getPriority());
  }

  static addToList(newPlugin, oldList) {
    const newList = oldList.filter(oldPlugin => oldPlugin.constructor.name !== newPlugin.constructor.name);
    newList.push(newPlugin);
    return PluginManager.orderPlugins(newList);
  }
}

module.exports = PluginManager;
