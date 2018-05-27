const BasePlugin = require('../base/BasePlugin');

/**
 * Plugin responsible for selecting a resource to crawl from the current site.
 */
class SelectResourcePlugin extends BasePlugin {
  constructor(opts) {
    super(opts || {});

    // frequency for crawling resources
    if (this.opts.crawlFrequency) {
      this.opts.crawlFrequency = parseInt(this.opts.crawlFrequency, 10);
    }
  }

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
    return site.getResourceToCrawl(this.opts.crawlFrequency);
  }
}

module.exports = SelectResourcePlugin;
