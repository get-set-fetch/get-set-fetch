require('chai/register-assert');
const nock = require('nock');

const NodeFetchPlugin = gsfRequire('lib/plugins/fetch/NodeFetchPlugin');

describe('Test NodeFetchPlugin', () => {
  let nodeFetchPlugin = null;

  beforeEach(() => {
    nodeFetchPlugin = new NodeFetchPlugin();
  });

  it('http fetch default port', async () => {
    nock('http://www.site.com').get('/pageA').reply(200, 'httpA');
    const { content } = await nodeFetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
    assert.strictEqual('httpA', content);
  });

  it('http fetch custom port', async () => {
    nock('http://www.site.com:8090').get('/pageA').reply(200, 'httpA-8090');
    const { content } = await nodeFetchPlugin.fetch({ url: 'http://www.site.com:8090/pageA' });
    assert.strictEqual('httpA-8090', content);
  });

  it('https fetch default port', async () => {
    nock('https://www.site.com').get('/pageA').reply(200, 'httspA');
    const { content } = await nodeFetchPlugin.fetch({ url: 'https://www.site.com/pageA' });
    assert.strictEqual('httspA', content);
  });

  it('http fetch user agent', async () => {
    const userAgent = 'custom-user-agent';
    nock('http://www.site.com')
      .matchHeader('User-Agent', userAgent)
      .get('/pageA').reply(200, 'httpA');

    nodeFetchPlugin.opts = {
      reqHeaders: { 'User-Agent': userAgent },
    };

    const { content } = await nodeFetchPlugin.fetch({ url: 'http://www.site.com/pageA' });
    assert.strictEqual('httpA', content);
  });
});
