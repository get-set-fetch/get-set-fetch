require('chai/register-assert');

const JsDomPlugin = gsfRequire('lib/plugins/process/JsDomPlugin');

describe('Test JsDomPlugin', () => {
  let jsDomPlugin = null;

  beforeEach(() => {
    jsDomPlugin = new JsDomPlugin();
  });

  it('generate window document', () => {
    const doc = jsDomPlugin.genDocument({ content: '<body/>' });
    assert.isFunction(doc.getElementsByTagName);
    assert.strictEqual(1, doc.getElementsByTagName('body').length);
  });
});
