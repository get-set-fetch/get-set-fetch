const GetSetFetch = require.main.require('lib/storage/Storage');
GetSetFetch.plugins = {
  SelectResourcePlugin: require.main.require('lib/plugins/select/SelectResourcePlugin'),
  NodeFetchPlugin: require.main.require('lib/plugins/fetch/NodeFetchPlugin'),
  JsDomPlugin: require.main.require('lib/plugins/process/JsDomPlugin'),
  ExtractUrlPlugin: require.main.require('lib/plugins/process/ExtractUrlPlugin'),
  RobotsFilterPlugin: require.main.require('lib/plugins/process/RobotsFilterPlugin'),
  UpdateResourcePlugin: require.main.require('lib/plugins/save/UpdateResourcePlugin'),
  InsertResourcePlugin: require.main.require('lib/plugins/save/InsertResourcePlugin'),
};
module.exports = GetSetFetch;
