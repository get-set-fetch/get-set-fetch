const http = require('http');

const GetSetFetch = gsfRequire('lib/index.js');

// ChromeFetchPlugin options
const chromeOpts = {
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
      http.get(request.url(), async (response) => {
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
    new GetSetFetch.plugins.ChromeFetchPlugin(chromeOpts),
  ],
  defaultPluginsWithChromeFetch,
);

module.exports = [
  {
    info: 'default plugins',
    plugins: defaultPlugins,
  },
  {
    info: 'default plugins -NodeFetchPlugin +ChromeFetchPlugin',
    plugins: defaultPluginsWithChromeFetch,
  },
];
