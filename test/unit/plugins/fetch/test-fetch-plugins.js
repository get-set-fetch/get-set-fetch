require('chai/register-assert');
const nock = require('nock');

const NodeFetchPlugin = gsfRequire('lib/plugins/fetch/NodeFetchPlugin');
const ChromeFetchPlugin = gsfRequire('lib/plugins/fetch/ChromeFetchPlugin');

const pluginConfigurations = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');

const fetchPlugins = [
  new NodeFetchPlugin(),
  new ChromeFetchPlugin(pluginConfigurations.opts[ChromeFetchPlugin.name]),
];

fetchPlugins.forEach((fetchPlugin) => {
  describe(`Test FetchPlugins common functionality: ${fetchPlugin.constructor.name}`, () => {
    after(async () => {
      await fetchPlugin.cleanup();
    });

    it('http fetch default port', async () => {
      nock('http://www.site.com').get('/pageA').reply(200, 'httpA', { 'Content-Type': 'text/html; charset=utf-8' });
      const { content } = await fetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
      assert.strictEqual('httpA', TestUtils.stripChromeExtraTags(content));
    });

    it('http fetch custom port', async () => {
      nock('http://www.site.com:8090').get('/pageA').reply(200, 'httpA-8090', { 'Content-Type': 'text/html; charset=utf-8' });
      const { content } = await fetchPlugin.fetch({ url: 'http://www.site.com:8090/pageA' });
      assert.strictEqual('httpA-8090', TestUtils.stripChromeExtraTags(content));
    });

    it('https fetch default port', async () => {
      nock('https://www.site.com').get('/pageA').reply(200, 'httspA', { 'Content-Type': 'text/html; charset=utf-8' });
      const { content } = await fetchPlugin.fetch({ url: 'https://www.site.com/pageA' });
      assert.strictEqual('httspA', TestUtils.stripChromeExtraTags(content));
    });

    it('http fetch user agent', async () => {
      const userAgent = 'custom-user-agent';
      nock('http://www.site.com')
        .matchHeader('User-Agent', userAgent)
        .get('/pageA').reply(200, 'httpA', { 'Content-Type': 'text/html; charset=utf-8' });

      Object.assign(fetchPlugin.opts, {
        reqHeaders: { 'User-Agent': userAgent },
      });

      const { content } = await fetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
      assert.strictEqual('httpA', TestUtils.stripChromeExtraTags(content));
    });

    it('returns request headers', async () => {
      nock('http://www.site.com')
        .get('/pageA').reply(200, 'httpA', { 'Content-Type': 'text/html; charset=utf-8' });

      Object.assign(fetchPlugin.opts, {
        reqHeaders: { 'User-Agent': 'myUserAgent' },
      });

      const { requestHeaders } = await fetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
      assert.deepEqual(requestHeaders, fetchPlugin.opts.reqHeaders);
    });
  });
});
