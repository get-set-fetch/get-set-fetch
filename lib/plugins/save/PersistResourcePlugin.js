const Url = require('url');
const fs = require('fs');
const path = require('path');

const Logger = gsfRequire('lib/logger/Logger').getLogger('PersistResourcePlugin');
const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

/**
 * Plugin responsible for writing resources to disk.
 */
class PersistResourcePlugin extends BasePlugin {
  constructor(opts) {
    super(opts || {});

    if (!(this.opts.extensionRe instanceof RegExp)) {
      this.opts.extensionRe = /^(gif|png|jpg)$/i;
    }

    // also add regexp support
    if (!this.opts.target) {
      this.opts.target = './tmp';
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.SAVE;
  }

  test(resource) {
    // check extension
    const resourceUrl = Url.parse(resource.url);
    const extIdx = resourceUrl.pathname.lastIndexOf('.');
    if (extIdx !== -1) {
      const extVal = resourceUrl.pathname.substr(extIdx + 1);
      return extVal.match(this.opts.extensionRe) !== null;
    }

    return false;
  }

  apply(site, resource) {
    const resourceUrl = Url.parse(resource.url);
    const fileName = resourceUrl.pathname.substr(resourceUrl.pathname.lastIndexOf('/') + 1);

    const filePath = path.join(this.opts.target, fileName);
    fs.writeFile(filePath, resource.content, (err) => {
      if (err) {
        Logger.error(`could not save file: ${filePath}`);
        Logger.error(err);
      }
    });
  }
}

module.exports = PersistResourcePlugin;
