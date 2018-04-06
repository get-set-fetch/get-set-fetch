// npm does not support optional dependencies like python setuptools extras_require
// because of this, db related dependencies are stored in devDependencies
// eslint-disable-next-line import/no-extraneous-dependencies
const { ObjectID } = require('mongodb');

const BaseResource = gsfRequire('lib/storage/base/BaseResource');

/* eslint-disable no-underscore-dangle */
class MongoResource extends BaseResource {
  static get builder() {
    return MongoResource.db.collection('Resources');
  }

  static async get(urlOrId) {
    const query = ObjectID.isValid(urlOrId) ? { _id: urlOrId } : { url: urlOrId };
    const result = await MongoResource.builder.findOne(query);

    if (result) {
      Object.assign(result, BaseResource.parseResult(result));
      return Object.assign(new MongoResource(), result);
    }
    return null;
  }

  static async getResourceToCrawl(siteId) {
    const result = await MongoResource.builder.findOneAndUpdate(
      { siteId, crawledAt: null, crawlInProgress: false },
      { $set: { crawlInProgress: true } },
    );
    return result.value ? Object.assign(new MongoResource(), result.value) : null;
  }

  static delAll() {
    return MongoResource.builder.deleteMany({});
  }

  static count(siteId) {
    return MongoResource.builder.count({ siteId });
  }

  get id() {
    return this._id;
  }

  save() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      const result = await MongoResource.builder.insertOne(this.serialize());
      this._id = result.insertedId;
      resolve(this._id);
    });
  }

  update() {
    this.crawledAt = Date.now();
    this.crawlInProgress = false;
    return MongoResource.builder.update({ _id: this.id }, this.serialize());
  }

  del() {
    return MongoResource.builder.deleteOne({ _id: this.id });
  }
}

module.exports = MongoResource;
