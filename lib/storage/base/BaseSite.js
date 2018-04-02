const UrlUtils = gsfRequire('lib/utils/UrlUtils');
const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');
const PluginManager = gsfRequire('lib/plugins/PluginManager');
const BaseEntity = require('./BaseEntity');

/* eslint-disable no-unused-vars, class-methods-use-this */
/**
 * Persistence class representing a website. Each website has its own crawling configuration.
 * @extends BaseEntity
 */
class BaseSite extends BaseEntity {
  static getResourceToCrawl(siteId) {
    throw new Error('not implemented!');
  }

  static parseResult(result) {
    return {
      plugins: PluginManager.instantiate(JSON.parse(result.plugins)),
      requestHeaders: JSON.parse(result.requestHeaders),
    };
  }

  /**
   * Create a site.
   * @param {string} name - site name.
   * @param {string} url - site url.
   * @param {boolean} createDefaultPlugins - whether or not to crawl the site with the default plugins
   */
  constructor(name, url, requestHeaders, createDefaultPlugins = true) {
    super();
    this.name = name;
    this.url = url;
    this.requestHeaders = requestHeaders;
    if (createDefaultPlugins) {
      this.plugins = PluginManager.DEFAULT_PLUGINS;
    }
  }

  /**
   * add or update a plugin to be used when crawling the site.
   * @param {object} pluginInstance - plugin instance
   */
  use(pluginInstance) {
    if (!(pluginInstance instanceof BasePlugin)) {
      if (pluginInstance.constructor && pluginInstance.constructor.name) {
        throw new Error(`Expected an instance extending BasePlugin: Site.get(<${pluginInstance.constructor.name}>)`);
      } else {
        throw new Error('Expected a class instance: Site.get(<pluginInstance>)');
      }
    }
    this.plugins = PluginManager.addToList(pluginInstance, this.plugins);
  }

  get props() {
    return ['name', 'url', 'robotsTxt', 'plugins', 'requestHeaders'];
  }

  /**
   * add or update a plugin to be used when crawling the site.
   * @return {object} - site properties to be persisted.
   */
  serialize() {
    const serializedObj = super.serialize();
    serializedObj.requestHeaders = JSON.stringify(serializedObj.requestHeaders);
    serializedObj.plugins = JSON.stringify(this.plugins);
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

  fetchRobots(reqHeaders) {
    return new Promise(async (resolve, reject) => {
      let robotsContent = null;
      const robotsUrl = `${UrlUtils.extractPathOrigin(this.url)}/robots.txt`;

      try {
        const fetchPlugin = PluginManager.instantiate({ name: 'NodeFetchPlugin', opts: reqHeaders || this.requestHeaders });
        robotsContent = (await fetchPlugin.fetch({ url: robotsUrl })).content;
      } catch (err) {
        console.error(`err fetching robots.txt: ${robotsUrl}`);
        console.error(err);
      }

      // update site with robots content
      this.robotsTxt = robotsContent || '#';
      await this.update();

      // everything completed fine
      resolve();
    });
  }

  /**
   * loop through ordered (based on phase) plugins and apply each one to the current (site, resource) pair
   */
  async crawlResource() {
    let resource = null;
    for (let i = 0; i < this.plugins.length; i += 1) {
      if (this.plugins[i].test(resource)) {
        try {
          // SELECT phase, init the resource
          if (resource === null) {
            resource = await this.plugins[i].apply(this);
          } else {
            resource = Object.assign(resource, (await this.plugins[i].apply(this, resource)));
          }

          // no resource present
          if (resource === null) {
            break;
          }
        } catch (err) {
          console.log(`error: ${this.plugins[i].constructor.name}`);
          console.log(err);
        }
      }
    }

    return resource;
  }

  /**
   * crawl until there are no more resource to crawl or maxNo is reached
   */
  async crawl() {
    return new Promise(async (resolve, reject) => {
      while (true) {
        try {
          const resource = await this.crawlResource();
          // no more resources to crawl
          if (!resource) {
            break;
          }
        } catch (err) {
          reject(err);
        }
      }

      // crawl complete
      resolve();
    });
  }
}

module.exports = BaseSite;
