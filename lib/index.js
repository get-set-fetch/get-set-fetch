const Storage = require('./storage/Storage');

const plugins = {
  // base plugin
  BasePlugin: require('./plugins/base/BasePlugin'),

  // default plugins
  SelectResourcePlugin: require('./plugins/select/SelectResourcePlugin'),
  NodeFetchPlugin: require('./plugins/fetch/NodeFetchPlugin'),
  JsDomPlugin: require('./plugins/process/JsDomPlugin'),
  ExtractUrlPlugin: require('./plugins/process/ExtractUrlPlugin'),
  RobotsFilterPlugin: require('./plugins/process/RobotsFilterPlugin'),
  UpdateResourcePlugin: require('./plugins/save/UpdateResourcePlugin'),
  InsertResourcePlugin: require('./plugins/save/InsertResourcePlugin'),

  // optional plugins
  PersistResourcePlugin: require('./plugins/save/PersistResourcePlugin'),
  ChromeFetchPlugin: require('./plugins/fetch/ChromeFetchPlugin'),
};

const PluginManager = require('./plugins/PluginManager');

PluginManager.registerDefaults();
PluginManager.registerOptionals();

const Logger = require('./logger/Logger');

const BloomFilter = require('./filters/bloom/BloomFilter');

module.exports = {
  Storage,

  plugins,
  PluginManager,

  BloomFilter,

  Logger,
};
