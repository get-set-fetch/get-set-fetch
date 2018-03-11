const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const UpdateResourcePlugin = gsfRequire('lib/plugins/save/UpdateResourcePlugin');

describe('Test UpdateResourcePlugin', () => {
  let updateResourcePlugin = null;

  beforeEach(() => {
    updateResourcePlugin = new UpdateResourcePlugin();
  });

  it('apply', async () => {
    const resource = {
      update: () => {},
    };

    const updateSpy = chai.spy.on(resource, 'update');
    updateResourcePlugin.apply({}, resource);
    chai.expect(updateSpy).to.have.been.called();
  });
});
