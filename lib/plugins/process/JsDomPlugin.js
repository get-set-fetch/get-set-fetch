const { JSDOM } = require('jsdom');

const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

/**
 * Plugin responsible for generating a jsdom document.
 */
class JsDomPlugin extends BasePlugin {
  constructor(opts) {
    super(opts || {});

    // add defaults
    if (!(this.opts && this.opts.contentTypeRe instanceof RegExp)) {
      this.opts.contentTypeRe = /html/i;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.PRE_PROCESS;
  }

  test(resource) {
    return this.opts.contentTypeRe.test(resource.contentType);
  }

  apply(site, resource) {
    return ({ document: this.genDocument(resource) });
  }

  // eslint-disable-next-line class-methods-use-this
  genDocument(resource) {
    return new JSDOM(resource.content, {
      features: {
        FetchExternalResources: false,
        ProcessExternalResources: false,
      },
    }).window.document;
  }
}

module.exports = JsDomPlugin;
