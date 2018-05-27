const BaseEntity = require('./base/BaseEntity');
const BaseSite = require('./base/BaseSite');
const BaseResource = require('./base/BaseResource');
const KnexStorage = require('./knex/KnexStorage');
const MongoStorage = require('./mongo/MongoStorage');

const DEFAULT_DB_CONN = {
  info: 'knex with sqlite3 in memory',
  client: 'sqlite3',
  useNullAsDefault: true,
  debug: false,
  connection: {
    filename: ':memory:',
  },
};

/*
reset BaseEntity settings for each db setup
making sure no db can be used at the same time
*/
function reset() {
  BaseEntity.knex = null;
  BaseEntity.mongo = null;
  BaseEntity.db = null;
}

async function close() {
  return BaseEntity.knex ? KnexStorage.close() : MongoStorage.close();
}

function init(dbConfig) {
  if (!dbConfig) {
    return init(DEFAULT_DB_CONN);
  }

  reset();
  return dbConfig.client ? KnexStorage.init(dbConfig) : MongoStorage.init(dbConfig);
}

module.exports = {
  init,
  close,
  BaseEntity,
  BaseSite,
  BaseResource,
};
