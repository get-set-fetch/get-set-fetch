require('chai/register-assert');

const Storage = gsfRequire('lib/storage/Storage');
const mongodb = require('mongodb');

describe('Test Storage Init', () => {
  afterEach(async () => {
    await Storage.close();
  });

  it('storage init - default sqlite:memory', async () => {
    const { Site } = await Storage.init();
    assert.isFunction(Site.knex, 'Site should provide access to knex');
    assert.strictEqual(Site.knex.schema.client.config.client, 'sqlite3');
  });

  it('storage init - sqlite:memory', async () => {
    const conn = {
      info: 'knex with sqlite3 in memory',
      client: 'sqlite3',
      useNullAsDefault: true,
      debug: false,
      connection: {
        filename: ':memory:',
      },
    };
    const { Site } = await Storage.init(conn);
    assert.isFunction(Site.knex, 'Site should provide access to knex');
    assert.strictEqual(Site.knex.schema.client.config.client, 'sqlite3');
  });

  it('storage init - mongodb', async () => {
    const conn = {
      info: 'mongoDB',
      url: 'mongodb://localhost:27027',
      dbName: 'get-set-fetch-test',
    };
    const { Site } = await Storage.init(conn);
    assert.instanceOf(Site.db, mongodb.Db, 'Site should provide access to mongo db instance');
  });
});

