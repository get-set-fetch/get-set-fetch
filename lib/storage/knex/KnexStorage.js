const BaseEntity = require('../base/BaseEntity');

async function init(dbConfig) {
  // npm does not support optional dependencies like python setuptools extras_require
  // because of this, db related dependencies are stored in devDependencies
  // eslint-disable-next-line import/no-extraneous-dependencies
  const Knex = require('knex');
  const KnexResource = require('./KnexResource');
  const KnexSite = require('./KnexSite');

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

async function close() {
  await BaseEntity.knex.destroy();
}

module.exports = {
  init,
  close,
};
