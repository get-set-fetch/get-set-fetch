const URL = require('url');

const BasePlugin = require.main.require('lib/plugins/base/BasePlugin');

class NodeFetchPlugin extends BasePlugin {
  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.FETCH;
  }

  // eslint-disable-next-line class-methods-use-this
  test(resource) {
    const { protocol } = URL.parse(resource.url);
    return protocol === 'http' || protocol === 'https';
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
      lib.get(reqOpts, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        if (statusCode < 200 || statusCode > 299) {
          reject(new Error({ statusCode, headers: response.headers }));
        }

        response.setEncoding('utf8');
        let rawData = '';

        response.on('data', (chunk) => {
          rawData += chunk;
        });

        response.on('end', () => {
          resolve({
            statusCode,
            contentType,
            rawData,
          });
        });
      })
        .on('error', (err) => {
          console.error(`error fetching: ${resource.url}`);
          reject(err);
        });
    });
  }
}

module.exports = NodeFetchPlugin;
