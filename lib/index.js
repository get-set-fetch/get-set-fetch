const GetSetFetch = require.main.require('lib/storage/Storage');
GetSetFetch.plugins = {
  // default plugins
  SelectResourcePlugin: require.main.require('lib/plugins/select/SelectResourcePlugin'),
  NodeFetchPlugin: require.main.require('lib/plugins/fetch/NodeFetchPlugin'),
  JsDomPlugin: require.main.require('lib/plugins/process/JsDomPlugin'),
  ExtractUrlPlugin: require.main.require('lib/plugins/process/ExtractUrlPlugin'),
  RobotsFilterPlugin: require.main.require('lib/plugins/process/RobotsFilterPlugin'),
  UpdateResourcePlugin: require.main.require('lib/plugins/save/UpdateResourcePlugin'),
  InsertResourcePlugin: require.main.require('lib/plugins/save/InsertResourcePlugin'),

  // optional plugins
  PersistResourcePlugin: require.main.require('lib/plugins/save/PersistResourcePlugin'),
};
GetSetFetch.PluginManager = require.main.require('lib/plugins/PluginManager');

GetSetFetch.PluginManager.registerDefaults();
GetSetFetch.PluginManager.registerOptionals();
module.exports = GetSetFetch;
