const URL = require('url');

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

          /*
          convert stream data to 'utf8' if contentType not present or contentType is html or text
          for all other objects work with the default Buffer object
          */
          let rawData = null;
          if (!contentType || contentType.length === 0) {
            rawData = await NodeFetchPlugin.readUtf8Stream(response);
          } else if (/(html|text)/.test(contentType)) {
            rawData = await NodeFetchPlugin.readUtf8Stream(response);
          } else {
            rawData = await NodeFetchPlugin.readBufferStream(response);
          }

          resolve({
            statusCode,
            contentType,
            rawData,
          });
        })
        .on('error', (err) => {
          console.error(`error fetching: ${resource.url}`);
          reject(err);
        });
    });
  }

  static readUtf8Stream(response) {
    response.setEncoding('utf8');
    let rawData = '';

    response.on('data', (chunk) => {
      rawData += chunk;
    });

    return new Promise((resolve) => {
      response.on('end', () => {
        resolve(rawData);
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
