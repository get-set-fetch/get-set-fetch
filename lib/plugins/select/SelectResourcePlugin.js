const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

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
