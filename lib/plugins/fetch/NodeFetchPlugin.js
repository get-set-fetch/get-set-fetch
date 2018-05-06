const URL = require('url');

const Logger = gsfRequire('lib/logger/Logger').getLogger('NodeFetchPlugin');
const BasePlugin = gsfRequire('lib/plugins/base/BasePlugin');

/**
 * Plugin responsible for download a site resource.
 */
class NodeFetchPlugin extends BasePlugin {
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

  fetch(resource) {
    return new Promise((resolve, reject) => {
      const urlObj = URL.parse(resource.url);

      // add urlObj props to http|https request options
      const reqOpts = (
        ({
          protocol, host, hostname, port, path,
        }) => ({
          protocol, host, hostname, port, path,
        })
      )(urlObj);

      // add user agent
      // example format: User-Agent: Mozilla/<version> (<system-information>) <platform> (<platform-details>) <extensions>
      // 'User-Agent': 'Mozilla/5.0'
      reqOpts.headers = this.opts && this.opts.reqHeaders ? this.opts.reqHeaders : {};
      const lib = reqOpts.protocol === 'https:' ? require('https') : require('http');
      lib
        .get(reqOpts, async (response) => {
          const { statusCode } = response;

          /*
          RFC 7230-7237 : each header field consists of a case-insensitive field name
          "content-type" can be present in multiple upper/lower case variations, try to identify the most popular ones
          */
          const contentType = response.headers['Content-Type'] || response.headers['content-type'];

          if (statusCode < 200 || statusCode > 299) {
            reject(new Error({ statusCode, headers: response.headers }));
          }

          // always handle content as Buffer object, no matter the contentType
          const content = await NodeFetchPlugin.readBufferStream(response);

          resolve({
            requestHeaders: reqOpts.headers,
            statusCode,
            contentType,
            content,
          });
        })
        .on('error', (err) => {
          Logger.error(`error fetching: ${resource.url}`);
          reject(err);
        });
    });
  }

  static readUtf8Stream(response) {
    response.setEncoding('utf8');
    let content = '';

    response.on('data', (chunk) => {
      content += chunk;
    });

    return new Promise((resolve) => {
      response.on('end', () => {
        resolve(content);
      });
    });
  }

  static readBufferStream(response) {
    const chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    return new Promise((resolve) => {
      response.on('end', () => {
        resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
      });
    });
  }
}

module.exports = NodeFetchPlugin;
