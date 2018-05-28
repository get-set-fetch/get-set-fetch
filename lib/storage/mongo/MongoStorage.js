const BaseEntity = require('../base/BaseEntity');

class MongoStorage {
  static async init(dbConfig) {
  // npm does not support optional dependencies like python setuptools extras_require
  // because of this, db related dependencies are stored in devDependencies
  // eslint-disable-next-line import/no-extraneous-dependencies
    const { MongoClient } = require('mongodb');
    const MongoResource = require('./MongoResource');
    const MongoSite = require('./MongoSite');

    BaseEntity.mongo = await MongoClient.connect(dbConfig.url);
    BaseEntity.db = BaseEntity.mongo.db(dbConfig.dbName);

    return { Site: MongoSite, Resource: MongoResource };
  }

  static async close() {
    await BaseEntity.mongo.close();
  }
}

module.exports = MongoStorage;
