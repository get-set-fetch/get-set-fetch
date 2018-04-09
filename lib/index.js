const path = require('path');

// add a require wrapper for get-set-fetch module
// eslint-disable-next-line import/no-dynamic-require
global.gsfRequire = name => require(path.join(__dirname, '..', name));

const GetSetFetch = gsfRequire('lib/storage/Storage');
GetSetFetch.plugins = {
  // base plugin
  BasePlugin: gsfRequire('lib/plugins/base/BasePlugin'),

  // default plugins
  SelectResourcePlugin: gsfRequire('lib/plugins/select/SelectResourcePlugin'),
  NodeFetchPlugin: gsfRequire('lib/plugins/fetch/NodeFetchPlugin'),
  JsDomPlugin: gsfRequire('lib/plugins/process/JsDomPlugin'),
  ExtractUrlPlugin: gsfRequire('lib/plugins/process/ExtractUrlPlugin'),
  RobotsFilterPlugin: gsfRequire('lib/plugins/process/RobotsFilterPlugin'),
  UpdateResourcePlugin: gsfRequire('lib/plugins/save/UpdateResourcePlugin'),
  InsertResourcePlugin: gsfRequire('lib/plugins/save/InsertResourcePlugin'),

  // optional plugins
  PersistResourcePlugin: gsfRequire('lib/plugins/save/PersistResourcePlugin'),
  ChromeFetchPlugin: gsfRequire('lib/plugins/fetch/ChromeFetchPlugin'),
};
GetSetFetch.PluginManager = gsfRequire('lib/plugins/PluginManager');

GetSetFetch.PluginManager.registerDefaults();
GetSetFetch.PluginManager.registerOptionals();
module.exports = GetSetFetch;
