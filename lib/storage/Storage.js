const BaseEntity = require('./base/BaseEntity');

async function setupKnexStorage(dbConfig) {
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

module.exports.init = dbConfig => setupKnexStorage(dbConfig);

module.exports.close = () => {
  BaseEntity.knex.destroy();
};
