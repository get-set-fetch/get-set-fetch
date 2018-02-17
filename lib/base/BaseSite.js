const BaseEntity = require('./BaseEntity');

/* eslint-disable no-unused-vars, class-methods-use-this */
class BaseSite extends BaseEntity {
  static getResourceToCrawl(siteId) {
    throw new Error('not implemented!');
  }

  constructor(name, url, requestHeaders) {
    super();
    this.name = name;
    this.url = url;
    this.requestHeaders = requestHeaders;
  }

  get props() {
    return ['name', 'url', 'robotsTxt', 'requestHeaders'];
  }

  serialize() {
    const serializedObj = super.serialize();
    serializedObj.requestHeaders = JSON.stringify(serializedObj.requestHeaders);
    return serializedObj;
  }

  getResourceToCrawl() {
    throw new Error('not implemented!');
  }

  saveResources(urls, depth) {
    throw new Error('not implemented!');
  }

  getResourceCount() {
    throw new Error('not implemented!');
  }
}

module.exports = BaseSite;
