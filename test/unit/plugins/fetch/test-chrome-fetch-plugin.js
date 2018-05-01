require('chai/register-assert');
const nock = require('nock');

const ChromeFetchPlugin = gsfRequire('lib/plugins/fetch/ChromeFetchPlugin');

const pluginConfigs = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');

describe('Test ChromeFetchPlugin', () => {
  let chromeFetchPlugin = null;

  before(() => {
    chromeFetchPlugin = new ChromeFetchPlugin(pluginConfigs.opts[ChromeFetchPlugin.name]);
  });

  after(async () => {
    await chromeFetchPlugin.cleanup();
  });

  it('page closes after singles fetch completes', async () => {
    nock('http://www.site.com').get('/pageA').reply(200, 'httpA', { 'Content-Type': 'text/html; charset=utf-8' });
    const { content } = await chromeFetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
    assert.strictEqual('httpA', TestUtils.stripChromeExtraTags(content.toString()));

    assert.strictEqual(1, (await chromeFetchPlugin.browser.pages()).length);
  });

  it('page closes after parallel fetches complete', async () => {
    nock('http://www.site.com').persist().get('/pageA').reply(200, 'httpA', { 'Content-Type': 'text/html; charset=utf-8' });

    const fetchPromises = [];
    for (let i = 0; i < 5; i += 1) {
      fetchPromises.push(chromeFetchPlugin.fetch({ url: 'http://www.site.com/pageA' }));
    }

    await Promise.all(fetchPromises);
    assert.strictEqual(1, (await chromeFetchPlugin.browser.pages()).length);
  });
});
