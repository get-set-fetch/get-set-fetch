const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
class SelectResourcePlugin extends BasePlugin {
  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.SELECT;
  }

  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(site) {
    return site.getResourceToCrawl();
  }
}

module.exports = SelectResourcePlugin;
