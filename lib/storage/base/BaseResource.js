const BaseEntity = require('./BaseEntity');

/* eslint-disable no-unused-vars, class-methods-use-this */
class BaseResource extends BaseEntity {
  static getResourceToCrawl(siteId) {
    throw new Error('not implemented!');
  }

  constructor(siteId, url, depth) {
    super();
    // persisted
    this.siteId = siteId;
    this.url = url;
    this.depth = depth;
    this.crawledAt = null;

    // not persisted
    this.contentType = null;
    this.content = null;
    this.rawContent = null;
    this.urlsToAdd = [];
  }

  get props() {
    return ['siteId', 'url', 'depth', 'crawledAt'];
  }
}

module.exports = BaseResource;
