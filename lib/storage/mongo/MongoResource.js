// npm does not support optional dependencies like python setuptools extras_require
// because of this, db related dependencies are stored in devDependencies
// eslint-disable-next-line import/no-extraneous-dependencies
const { ObjectID } = require('mongodb');

const BaseResource = require('../base/BaseResource');

/* eslint-disable no-underscore-dangle */
class MongoResource extends BaseResource {
  static get builder() {
    return MongoResource.db.collection('Resources');
  }

  static parseResult(result) {
    return {
      info: JSON.parse(result.info),
      content: result.content ? result.content.buffer : null,
    };
  }

  static async get(urlOrId) {
    const query = ObjectID.isValid(urlOrId) ? { _id: urlOrId } : { url: urlOrId };
    const result = await MongoResource.builder.findOne(query);

    if (result) {
      Object.assign(result, this.parseResult(result));
      return Object.assign(new MongoResource(), result);
    }
    return null;
  }

  static async getResourceToCrawl(siteId, crawlFrequency) {
    const crawledAtCondition = {
      $or: [
        { crawledAt: null },
      ],
    };

    /*
      nodejs client side generating dates like new Date(Date.now()) use UTC
      mongodb server side $currentDate used for updates uses UTC
      it's safe to compare the two
    */
    if (crawlFrequency) {
      crawledAtCondition.$or.push({
        crawledAt: {
          $type: 'date',
          $lte: new Date(Date.now() - (crawlFrequency * 60 * 60 * 1000)),
        },
      });
    }

    const result = await MongoResource.builder.findOneAndUpdate(
      {
        $and: [
          { siteId, crawlInProgress: false },
          crawledAtCondition,
        ],
      },
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
    this.crawlInProgress = false;
    return MongoResource.builder.update(
      { _id: this.id },
      {
        $set: this.serialize(),
        $currentDate: {
          crawledAt: true,
        },
      },
    );
  }

  del() {
    return MongoResource.builder.deleteOne({ _id: this.id });
  }
}

module.exports = MongoResource;
