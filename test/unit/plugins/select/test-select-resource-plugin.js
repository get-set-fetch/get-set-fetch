const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const SelectResourcePlugin = require.main.require('lib/plugins/select/SelectResourcePlugin');

describe('Test NodeFetchPlugin', () => {
  let selectResourcePlugin = null;

  beforeEach(() => {
    selectResourcePlugin = new SelectResourcePlugin();
  });

  it('apply', async () => {
    const site = {
      getResourceToCrawl: () => {},
    };

    const getResourceToCrawlSpy = chai.spy.on(site, 'getResourceToCrawl');
    selectResourcePlugin.apply(site);
    chai.expect(getResourceToCrawlSpy).to.have.been.called();
  });
});
