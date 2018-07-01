// base plugin
const BasePlugin = require('./base/BasePlugin');

// default plugins
const SelectResourcePlugin = require('./select/SelectResourcePlugin');
const NodeFetchPlugin = require('./fetch/NodeFetchPlugin');
const JsDomPlugin = require('./process/JsDomPlugin');
const ExtractUrlPlugin = require('./process/ExtractUrlPlugin');
const RobotsFilterPlugin = require('./process/RobotsFilterPlugin');
const UpdateResourcePlugin = require('./save/UpdateResourcePlugin');
const InsertResourcePlugin = require('./save/InsertResourcePlugin');

// optional plugins
const PersistResourcePlugin = require('./save/PersistResourcePlugin');
const ChromeFetchPlugin = require('./fetch/ChromeFetchPlugin');

/**
 * Registers and instantiates plugins.
 */
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

  static get constructorMap() {
    return this.constructor.constructorMap;
  }

  static reset() {
    this.constructor.constructorMap = new Map();
  }

  static register(instanceInput) {
    // handle both single element and array input
    const instancePlugins = instanceInput instanceof Array ? instanceInput : [instanceInput];

    this.constructor.constructorMap = this.constructorMap ? this.constructorMap : new Map();
    instancePlugins.forEach((instancePlugin) => {
      this.constructorMap.set(instancePlugin.constructor.name, instancePlugin.constructor);
    });
  }

  static registerDefaults() {
    this.register(this.DEFAULT_PLUGINS);
  }

  static registerOptionals() {
    this.register(new PersistResourcePlugin());
    this.register(new ChromeFetchPlugin());
  }

  static instantiate(jsonInput) {
    // handle both single element and array input
    const jsonPlugins = jsonInput instanceof Array ? jsonInput : [jsonInput];
    const instancePlugins = [];

    jsonPlugins.forEach((jsonPlugin) => {
      if (!this.constructorMap.has(jsonPlugin.name)) {
        throw new Error(`Plugin ${jsonPlugin.name} is not registered.`);
      }

      instancePlugins.push(new (this.constructorMap.get(jsonPlugin.name))(jsonPlugin.opts));
    });

    return instancePlugins.length === 1 ? instancePlugins[0] : instancePlugins;
  }

  static orderPlugins(instancePlugins) {
    return instancePlugins.sort((p1, p2) => p1.getPriority() - p2.getPriority());
  }

  static add(newPlugins, currentPlugins) {
    // validate new plugins
    newPlugins.forEach((newPlugin) => {
      this.validate(newPlugin);
    });

    // retrieve new constructor names and remove the matching old plugins
    const newPluginNames = newPlugins.map(newPlugin => newPlugin.constructor.name);
    const filteredCurrentPlugins = currentPlugins.filter(currentPlugin => newPluginNames.indexOf(currentPlugin.constructor.name) === -1);

    // return the final plugins in execution order
    return this.orderPlugins(newPlugins.concat(filteredCurrentPlugins));
  }

  static remove(toBeRemovedPluginNames, currentPlugins) {
    // remove plugins matching the obsolete constructor names
    const filteredPlugins = currentPlugins.filter(currentPlugin => toBeRemovedPluginNames.indexOf(currentPlugin.constructor.name) === -1);

    // return the final plugins in execution order
    return this.orderPlugins(filteredPlugins);
  }

  static validate(pluginInstance) {
    if (!(pluginInstance instanceof BasePlugin)) {
      throw new Error(`Invalid plugin instance: ${pluginInstance.constructor.name} doesn't extend BasePlugin.`);
    }
  }
}

module.exports = PluginManager;
