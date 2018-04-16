const BaseEntity = require('./base/BaseEntity');

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

async function closeStorage() {
  if (BaseEntity.knex) {
    await BaseEntity.knex.destroy();
  }
  else if (BaseEntity.mongo) {
    await BaseEntity.mongo.close();
  }
}

async function setupKnexStorage(dbConfig) {
  await closeStorage();
  reset();
  // npm does not support optional dependencies like python setuptools extras_require
  // because of this, db related dependencies are stored in devDependencies
  // eslint-disable-next-line import/no-extraneous-dependencies
  const Knex = require('knex');
  const KnexResource = require('./knex/KnexResource');
  const KnexSite = require('./knex/KnexSite');

  BaseEntity.knex = Knex(dbConfig);


  const tableSitesExist = await BaseEntity.knex.schema.hasTable('Sites');
  if (!tableSitesExist) {
    await BaseEntity.knex.schema.createTable('Sites', KnexSite.createTable);
  }

  const tableResourcesExist = await BaseEntity.knex.schema.hasTable('Resources');
  if (!tableResourcesExist) {
    await BaseEntity.knex.schema.createTable('Resources', KnexResource.createTable);
  }

  return { Site: KnexSite, Resource: KnexResource };
}

async function setupMongoDbStorage(dbConfig) {
  reset();
  // npm does not support optional dependencies like python setuptools extras_require
  // because of this, db related dependencies are stored in devDependencies
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { MongoClient } = require('mongodb');
  const MongoResource = require('./mongo/MongoResource');
  const MongoSite = require('./mongo/MongoSite');

  BaseEntity.mongo = await MongoClient.connect(dbConfig.url);
  BaseEntity.db = BaseEntity.mongo.db(dbConfig.dbName);

  return { Site: MongoSite, Resource: MongoResource };
}

/* tingo lacks a LOT of mongodb API (promises, One/Many related APIs), no longer supported */
/*
async function setupTingoDbStorage(dbConfig) {
  const { Db } = require('tingodb')(dbConfig.options);

  const BaseEntity = require('./base/BaseEntity');
  const MongoResource = require('./mongo/MongoResource');
  const MongoSite = require('./mongo/MongoSite');

  BaseEntity.db = new Db(dbConfig.dbName, {});

  return { Site: MongoSite, Resource: MongoResource };
}
*/

function initStorage(dbConfig) {
  if (!dbConfig) {
    return initStorage(DEFAULT_DB_CONN);
  }

  return dbConfig.client ? setupKnexStorage(dbConfig) : setupMongoDbStorage(dbConfig);
}


module.exports.init = initStorage;
module.exports.close = closeStorage;
