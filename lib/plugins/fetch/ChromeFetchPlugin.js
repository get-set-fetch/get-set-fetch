// eslint-disable-next-line import/no-extraneous-dependencies
const puppeteer = require('puppeteer');
const URL = require('url-parse');

const BasePlugin = require('../base/BasePlugin');

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
    const { protocol } = new URL(resource.url);
    return protocol === 'http:' || protocol === 'https:';
  }

  apply(site, resource) {
    return this.fetch(resource);
  }

  async fetch(resource) {
    if (!this.browser) {
      this.browser = await puppeteer.launch(this.opts.browser);
    }

    const page = await this.browser.newPage();

    if (this.opts.page.requestInterception) {
      await page.setRequestInterception(true);
      page.on('request', this.opts.page.requestInterceptFnc);
    }

    if (this.opts.page.extraHTTPHeaders) {
      await page.setExtraHTTPHeaders(this.opts.page.extraHTTPHeaders);
    }

    if (this.opts.reqHeaders) {
      await page.setExtraHTTPHeaders(this.opts.reqHeaders);
      if (this.opts.reqHeaders['User-Agent']) {
        await page.setUserAgent(this.opts.reqHeaders['User-Agent']);
      }
    }

    // retrieve the resource, wait for the page to finish loading
    const response = await page.goto(resource.url, this.opts.page.goto);
    const { status } = response;
    const contentType = response.headers()['Content-Type'] || response.headers()['content-type'];

    if (status < 200 || status > 299) {
      throw new Error({ status, headers: response.headers });
    }

    // always handle content as Buffer object, no matter the contentType
    // for text/html attempt to get the final document content (possibly dynamically generated)
    let content = null;
    if (/(text|html)/.test(contentType)) {
      content = Buffer.from(await page.content());
    }
    else {
      content = await response.buffer();
    }

    await page.close();

    return {
      requestHeaders: Object.assign({}, this.opts.page.extraHTTPHeaders, this.opts.reqHeaders),
      status,
      contentType,
      content,
    };
  }

  async cleanup() {
    await this.browser.close();
    this.browser = null;
  }
}

module.exports = ChromeFetchPlugin;
