const BasePlugin = require.main.require('lib/plugins/base/BasePlugin');

class InsertResourcePlugin extends BasePlugin {
  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.SAVE;
  }

  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(site, resource) {
    // only save new urls if there's something to save
    return resource.urlsToAdd.length > 0 ? site.saveResources(resource.urlsToAdd, resource.depth + 1) : null;
  }
}

module.exports = InsertResourcePlugin;
