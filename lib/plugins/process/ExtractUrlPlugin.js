const Url = require('url');

const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

/**
 * Plugin responsible for extracting new resources from a resource document.
 */
class ExtractUrlPlugin extends BasePlugin {
  constructor(opts) {
    super(opts || {});

    // add defaults
    if (!(this.opts.contentTypeRe instanceof RegExp)) {
      this.opts.contentTypeRe = /html/i;
    }

    if (!(this.opts.extensionRe instanceof RegExp)) {
      this.opts.extensionRe = /^(html|htm|php)$/i;
    }

    if (!Object.prototype.hasOwnProperty.call(this.opts, 'allowNoExtension')) {
      this.opts.allowNoExtension = true;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.PROCESS;
  }

  test(resource) {
    return this.opts.contentTypeRe.test(resource.contentType);
  }

  apply(site, resource) {
    return ({ urlsToAdd: this.extractResourceUrls(site, resource) });
  }

  /*
  scan for resources in <a href />, <img src />
  */
  extractResourceUrls(site, resource) {
    const doc = resource.document;
    const currentUrl = Url.parse(resource.url);

    const anchors = doc.getElementsByTagName('a');
    const anchorHrefs = Array.from(new Set(Object.keys(anchors).map(key => anchors[key].href)));

    const imgs = doc.getElementsByTagName('img');
    const imgSrcs = Array.from(new Set(Object.keys(imgs).map(key => imgs[key].src)));

    const partialUrls = anchorHrefs.concat(imgSrcs);
    const validUrls = new Set();

    partialUrls.forEach((partialUrl) => {
      const resourceUrl = this.createResourceUrl(currentUrl, partialUrl);
      if (this.isValidResourceUrl(currentUrl, resourceUrl)) {
        validUrls.add(resourceUrl.format());
      }
    });

    return Array.from(validUrls);
  }

  static absoluteUrl(absolutePath, relativePath) {
    const absSegments = absolutePath.split('/');
    const relSegments = relativePath.split('/');

    // get to current directory by removing filename or extra slash if present
    const lastSegment = absSegments[absSegments.length - 1];
    if (lastSegment.length === 0 || lastSegment.indexOf('.') !== -1) {
      absSegments.pop();
    }

    for (let i = 0; i < relSegments.length; i += 1) {
      switch (relSegments[i]) {
        case '.':
          break;
        case '..':
          absSegments.pop();
          break;
        default:
          absSegments.push(relSegments[i]);
      }
    }
    return absSegments.join('/');
  }


  // eslint-disable-next-line class-methods-use-this
  createResourceUrl(currentUrl, partialUrl) {
    let resourceUrl = null;
    // absolute path starting with "/" or http://, https://
    if (partialUrl.indexOf('/') === 0 || partialUrl.match(/^(http:\/\/|https:\/\/)/i)) {
      resourceUrl = Url.parse(partialUrl);
    } else {
      // relative path
      resourceUrl = Url.parse(ExtractUrlPlugin.absoluteUrl(currentUrl.path, partialUrl));
    }

    // create complete url without hash, page#1, page#2 should point to the same resource
    resourceUrl.hash = undefined;

    resourceUrl.protocol = resourceUrl.protocol === null ? currentUrl.protocol : resourceUrl.protocol;
    resourceUrl.hostname = resourceUrl.hostname === null ? currentUrl.hostname : resourceUrl.hostname;
    resourceUrl.port = resourceUrl.port === null ? currentUrl.port : resourceUrl.port;

    return resourceUrl;
  }

  isValidResourceUrl(currentUrl, resourceUrl) {
    // check valid protocol
    if (resourceUrl.protocol.match(/^(http:|https:)$/) === null) {
      return false;
    }

    // check if internal
    if (resourceUrl.hostname !== currentUrl.hostname) {
      return false;
    }

    // check valid pathname
    if (resourceUrl.pathname === null) {
      return false;
    }

    // check extension (valid one or not an extension at all)
    const extIdx = resourceUrl.pathname.lastIndexOf('.');
    if (extIdx !== -1) {
      const extVal = resourceUrl.pathname.substr(extIdx + 1);

      // . represents extension and not part of path, if extension make sure it's the correct one
      return extVal.match(this.opts.extensionRe) !== null;
    }

    // resource has no extension, return valid resource only if no extension flag allows it
    return this.opts.allowNoExtension;
  }
}

module.exports = ExtractUrlPlugin;
