const UrlUtils = require.main.require('lib/utils/UrlUtils');
const BaseEntity = require('./BaseEntity');

const SelectResourcePlugin = require.main.require('lib/plugins/select/SelectResourcePlugin');
const NodeFetchPlugin = require.main.require('lib/plugins/fetch/NodeFetchPlugin');
const JsDomPlugin = require.main.require('lib/plugins/process/JsDomPlugin');
const ExtractUrlPlugin = require.main.require('lib/plugins/process/ExtractUrlPlugin');
const RobotsFilterPlugin = require.main.require('lib/plugins/process/RobotsFilterPlugin');
const UpdateResourcePlugin = require.main.require('lib/plugins/save/UpdateResourcePlugin');
const InsertResourcePlugin = require.main.require('lib/plugins/save/InsertResourcePlugin');

/* eslint-disable no-unused-vars, class-methods-use-this */
class BaseSite extends BaseEntity {
  static getResourceToCrawl(siteId) {
    throw new Error('not implemented!');
  }

  static get DEFAULT_PLUGINS() {
    return [
      new SelectResourcePlugin(), // select: resource to crawl
      new NodeFetchPlugin(), // fetch: resource, follow redirects if needed
      new JsDomPlugin(), // pre-process: add jsdom property to resource
      new ExtractUrlPlugin(), // process: extract internal urls for further crawling
      new RobotsFilterPlugin(), // post-process: only allow robots.txt allowed resources to be saved, based on site.robots.txt
      new UpdateResourcePlugin(), // save: update current resource with the fetched content
      new InsertResourcePlugin(), // save: insert newly founded resources after parsing the current resource content
    ];
  }

  constructor(name, url, requestHeaders) {
    super();
    this.name = name;
    this.url = url;
    this.requestHeaders = requestHeaders;
    this.plugins = BaseSite.DEFAULT_PLUGINS;
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

  fetchRobots(reqHeaders) {
    return new Promise(async (resolve, reject) => {
      let robotsContent = null;
      const robotsUrl = `${UrlUtils.extractPathOrigin(this.url)}/robots.txt`;

      try {
        const fetchPlugin = new NodeFetchPlugin({ reqHeaders: reqHeaders || this.requestHeaders });
        robotsContent = (await fetchPlugin.fetch({ url: robotsUrl })).rawData;
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

  /*
  loop through ordered (based on phase) plugins and apply each one to the current (site, resource) pair
  */
  async crawlResource() {
    let resource = null;
    // eslint-disable-next-line no-await-in-loop
    for (let i = 0; i < this.plugins.length; i += 1) {
      try {
        if (resource === null) {
          resource = await this.plugins[i].apply(this);
        } else {
          resource = Object.assign(resource, (await this.plugins[i].apply(this, resource)));
        }
      } catch (err) {
        console.log(`error: ${this.plugins[i].constructor.name}`);
        console.log(err);
      }
    }


    return resource;
  }
}

module.exports = BaseSite;
