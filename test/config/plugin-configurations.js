const URL = require('url-parse');

const GetSetFetch = require('../../lib/index.js');

// ChromeFetchPlugin options
const chromeTestOpts = {
  browser: {
    ignoreHTTPSErrors: false,
    headless: true,
  },
  page: {
    goto: {
      timeout: 35 * 1000,
      waitUntil: 'load',
    },
    // add intercept to TestUtils
    requestInterception: true,
    requestInterceptFnc: async (request) => {
      const urlObj = new URL(request.url());

      // add urlObj props to http|https request options
      const reqOpts = {
        protocol: urlObj.protocol,
        host: urlObj.host,
        port: urlObj.port,
        path: urlObj.pathname,
      };

      reqOpts.headers = request.headers();
      const lib = reqOpts.protocol === 'https:' ? require('https') : require('http');
      lib.get(reqOpts, async (response) => {
        const contentType = response.headers['Content-Type'] || response.headers['content-type'];
        const { NodeFetchPlugin } = GetSetFetch.plugins;

        let body = null;

        if (/(text|html)/.test(contentType)) {
          body = await NodeFetchPlugin.readUtf8Stream(response);
        }
        else {
          body = await NodeFetchPlugin.readBufferStream(response);
        }

        request.respond({
          status: response.statusCode,
          headers: response.headers,
          body,
        });
      });
    },
  },
};

function getPlugins() {
  // I. default plugins
  const defaultPlugins = GetSetFetch.PluginManager.DEFAULT_PLUGINS;

  // II. default plugins with NodeFetchPlugin replaced by ChromeFetchPlugin
  let defaultPluginsWithChromeFetch = GetSetFetch.PluginManager.DEFAULT_PLUGINS;
  defaultPluginsWithChromeFetch = GetSetFetch.PluginManager.remove(
    [
      GetSetFetch.plugins.NodeFetchPlugin.name,
    ],
    defaultPluginsWithChromeFetch,
  );
  defaultPluginsWithChromeFetch = GetSetFetch.PluginManager.add(
    [
      new GetSetFetch.plugins.ChromeFetchPlugin(chromeTestOpts),
    ],
    defaultPluginsWithChromeFetch,
  );

  return [
    {
      info: 'default plugins',
      plugins: defaultPlugins,
    },
    {
      info: 'default plugins -NodeFetchPlugin +ChromeFetchPlugin',
      plugins: defaultPluginsWithChromeFetch,
    },
  ];
}


module.exports = {
  opts: {
    ChromeFetchPlugin: chromeTestOpts,
  },
  getPlugins,
};
