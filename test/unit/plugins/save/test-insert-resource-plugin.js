const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const InsertResourcePlugin = require.main.require('lib/plugins/save/InsertResourcePlugin');

describe('Test NodeFetchPlugin', () => {
  let insertResourcePlugin = null;

  beforeEach(() => {
    insertResourcePlugin = new InsertResourcePlugin();
  });

  it('apply', async () => {
    const site = {
      saveResources: () => {},
    };

    const resource = {
      urlsToAdd: ['url1', 'url2'],
      depth: 10,
    };

    const saveResourcesSpy = chai.spy.on(site, 'saveResources');
    insertResourcePlugin.apply(site, resource);
    chai.expect(saveResourcesSpy).to.have.been.called.with(resource.urlsToAdd, 11);
  });
});
