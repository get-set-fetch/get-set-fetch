const BasePlugin = require('../base/BasePlugin');

/**
 * Plugin responsible for updating a resource after crawling it.
 */
class UpdateResourcePlugin extends BasePlugin {
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
    return resource.update();
  }
}

module.exports = UpdateResourcePlugin;
