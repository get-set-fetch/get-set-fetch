// eslint-disable-next-line import/no-extraneous-dependencies
const puppeteer = require('puppeteer');
const URL = require('url');

const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

class ChromeFetchPlugin extends BasePlugin {
  static get defaultPageOpts() {
    return {
      goto: {
        timeout: 1 * 1000,
        waitUntil: 'load',
      },
    };
  }

  static get defaultBrowserOpts() {
    return {
      headless: true,
    };
  }

  constructor(opts) {
    super(opts);

    // chrome related vars
    this.browser = null;
    this.page = null;

    // add defaults
    this.opts.page = this.opts.page || ChromeFetchPlugin.defaultPageOpts;
    this.opts.browser = this.opts.browser || ChromeFetchPlugin.defaultBrowserOpts;
  }

  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.FETCH;
  }

  // eslint-disable-next-line class-methods-use-this
  test(resource) {
    const { protocol } = URL.parse(resource.url);
    return protocol === 'http:' || protocol === 'https:';
  }

  apply(site, resource) {
    return this.fetch(resource);
  }

  /*
  need to handle parallel connections
  can't open an increasing number of pages, at some point need to trigger page.close()
  unit test: make sure no more pages remain after crawling completes
  */
  async fetch(resource) {
    if (!this.browser) {
      this.browser = await puppeteer.launch(this.opts.browser);
      this.page = await this.browser.newPage();

      if (this.opts.page.requestInterception) {
        await this.page.setRequestInterception(true);
        this.page.on('request', this.opts.page.requestInterceptFnc);
      }

      if (this.opts.page.extraHTTPHeaders) {
        await this.page.setExtraHTTPHeaders(this.opts.page.extraHTTPHeaders);
      }
    }

    // retrieve the resource, wait for the page to finish loading
    const response = await this.page.goto(resource.url, this.opts.page.goto);
    const { status } = response;
    const contentType = response.headers()['Content-Type'] || response.headers()['content-type'];

    if (status < 200 || status > 299) {
      throw new Error({ status, headers: response.headers });
    }

    let content = null;
    if (/(text|html)/.test(contentType)) {
      content = await this.page.content();
    }
    else {
      content = await response.buffer();
    }

    return {
      requestHeaders: this.opts.page.extraHTTPHeaders,
      status,
      contentType,
      content,
    };
  }

  async destroy() {
    await this.browser.close();
    this.browser = null;
  }
}

module.exports = ChromeFetchPlugin;
