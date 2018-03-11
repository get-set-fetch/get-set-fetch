const BaseEntity = require('./BaseEntity');

/* eslint-disable no-unused-vars, class-methods-use-this */
/**
 * Persistence class representing a resource within a site.
 * When creating a new site, its url is automatically added as a resorce.
 * At site level, a resource is selected for crawling, crawled, processed and updated.
 * If the current resource links to other resources, those are persisted for future crawling,
 *  thus enabling a recursive crawl of the entire site.
 * @extends BaseEntity
 */
class BaseResource extends BaseEntity {
  static getResourceToCrawl(siteId) {
    throw new Error('not implemented!');
  }

  /**
   * Create a resource.
   * @param {string} siteId - id of the site the resource belongs to.
   * @param {string} url - resource url.
   * @param {number} createDefaultPlugins - resource link depth
   */
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
