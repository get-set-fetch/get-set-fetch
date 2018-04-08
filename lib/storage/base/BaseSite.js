const UrlUtils = gsfRequire('lib/utils/UrlUtils');
const PluginManager = gsfRequire('lib/plugins/PluginManager');
const ExtractUrlPlugin = gsfRequire('lib/plugins/process/ExtractUrlPlugin');
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
    };
  }

  static get defaultCrawlOpts() {
    return {
      maxConnections: 1,
      delay: 100,
    };
  }

  /**
   * Create a site.
   * @param {string} name - site name.
   * @param {string} url - site url.
   * @param {boolean} createDefaultPlugins - whether or not to crawl the site with the default plugins
   */
  constructor(name, url, createDefaultPlugins = true) {
    super();
    this.name = name;
    this.url = url;
    if (createDefaultPlugins) {
      this.plugins = PluginManager.DEFAULT_PLUGINS;
    }
  }

  getPlugins() {
    return this.plugins;
  }

  setPlugins(plugins) {
    plugins.forEach(pluginInstance => PluginManager.validate(pluginInstance));
    this.plugins = plugins;
  }

  /**
   * add or update plugins to be used when crawling the site.
   * @param {object} plugins - plugin instances
   */
  addPlugins(plugins) {
    this.plugins = PluginManager.add(plugins, this.plugins);
  }

  /**
   * remove plugins from site current plugins
   * @param {object} pluginNames - constructor names of the plugins to be removed
   */
  removePlugins(pluginNames) {
    this.plugins = PluginManager.remove(pluginNames, this.plugins);
  }

  get props() {
    return ['name', 'url', 'robotsTxt', 'plugins'];
  }

  /**
   * add or update a plugin to be used when crawling the site.
   * @return {object} - site properties to be persisted.
   */
  serialize() {
    const serializedObj = super.serialize();
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
        const fetchPlugin = PluginManager.instantiate({ name: 'NodeFetchPlugin', opts: reqHeaders });
        robotsContent = (await fetchPlugin.fetch({ url: robotsUrl })).content;
      }
      catch (err) {
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
  crawlResource() {
    return new Promise(async (resolve, reject) => {
      let resource = null;
      for (let i = 0; i < this.plugins.length; i += 1) {
        if (this.plugins[i].test(resource)) {
          try {
            // SELECT phase, init the resource
            if (resource === null) {
              resource = await this.plugins[i].apply(this);
            }
            else {
              resource = Object.assign(resource, (await this.plugins[i].apply(this, resource)));
            }

            // no resource present
            if (resource === null) {
              resolve(null);
              break;
            }
          }
          catch (err) {
            console.log(`error: ${this.plugins[i].constructor.name}`);
            console.log(err);
            reject(err);
            break;
          }
        }
      }

      resolve(resource);
    });
  }

  /*
  crawl resources in parallel until the maximum number of connections is reached
  each time a resource has finished crawling:
    - attempt to restore maximum number of parallel conections in case new resources have been found and inserted
  if a crawl resource attempt produces a null resource, stop if there are no more resources to crawl:
    - no pending crawl invocations
    - no active connections
  */
  crawl(opts) {
    let crawlPromise = null;

    // eslint-disable-next-line no-param-reassign
    opts = opts || {};

    // this is not a recursive crawl invocation but the main one
    if (!opts.recursion) {
      crawlPromise = this.initCrawl(opts);
    }
    // recursive crawl: don't initiate further resource crawls if the stop signal has been sent
    else if (this.crawlOpts.stop) {
      return null;
    }

    // invoke the maximum number of crawlResource connections in parallel
    while (this.crawlOpts.connections < this.crawlOpts.maxConnections) {
      this.crawlOpts.connections += 1;

      this.crawlResource()
        .then((resource) => {
          this.crawlOpts.connections -= 1;
          this.crawlOpts.resources += 1;

          const crawlComplete = false;
          // a resource was found and succesfully crawled
          if (resource) {
            // max number of resources to crawl has been reached
            if (this.crawlOpts.maxResources && this.crawlOpts.resources >= this.crawlOpts.maxResources) {
              this.completeCrawl();
              return;
            }
            // if there's no pending crawl, attempt to crawl another resource
            if (!this.crawlOpts.crawlTimeout) {
              this.crawlOpts.crawlTimeout = setTimeout(() => {
                this.crawl({ recursion: true });
                this.crawlOpts.crawlTimeout = null;
              }, this.crawlOpts.delay);
            }
          }
          // no resources left to crawl, if this is the last connection to close, crawl is complete
          else if (this.crawlOpts.connections === 0 && !this.crawlOpts.crawlTimeout) {
            this.completeCrawl();
          }
        })
        .catch((err) => {
          this.crawlOpts.connections -= 1;
          // if crawlResource throws an error and there's no pending crawl, attempt to crawl another one
          if (!this.crawlOpts.crawlTimeout) {
            this.crawlOpts.crawlTimeout = setTimeout(() => {
              this.crawl({ recursion: true });
              this.crawlOpts.crawlTimeout = null;
            }, this.crawlOpts.delay);
          }
        });
    }

    return crawlPromise;
  }

  initCrawl(opts) {
    // check if site crawling is already in progress
    if (this.crawlOpts && this.crawlOpts.resolve) {
      throw new Error(`Crawl for site ${this.name} already in progress.`);
    }

    // init main crawl options
    this.crawlOpts = {
      connections: 0,
      maxConnections: opts.maxConnections || BaseSite.defaultCrawlOpts.maxConnections,

      resources: 0,
      maxResources: opts.maxResources,

      delay: opts.delay || BaseSite.defaultCrawlOpts.delay,
      stop: false,
      crawlTimeout: null,
    };

    // pass secondary crawl options to plugins
    if (opts.maxDepth) {
      this.addPlugins([new ExtractUrlPlugin({ maxDepth: opts.maxDepth })]);
    }

    return new Promise((resolve, reject) => {
      this.crawlOpts.resolve = resolve;
    });
  }

  completeCrawl() {
    // resolve main crawl promise
    this.crawlOpts.resolve();
    // remove resolve to indicate no crawl in progress
    this.crawlOpts.resolve = null;
  }

  stop() {
    this.crawlOpts.stop = true;
  }
}

module.exports = BaseSite;
