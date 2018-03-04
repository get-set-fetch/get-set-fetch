// npm does not support optional dependencies like python setuptools extras_require
// because of this, db related dependencies are stored in devDependencies
// eslint-disable-next-line import/no-extraneous-dependencies
const { ObjectID } = require('mongodb');

const BaseSite = require.main.require('lib/storage/base/BaseSite');
const BloomFilter = require.main.require('lib/filters/bloom/BloomFilter');
const MongoResource = require('./MongoResource');

/* eslint-disable no-underscore-dangle */
class MongoSite extends BaseSite {
  static get builder() {
    return MongoResource.db.collection('Resources');
  }

  static async get(nameOrId) {
    const query = ObjectID.isValid(nameOrId) ? { _id: nameOrId } : { name: nameOrId };
    const result = await MongoSite.builder.findOne(query);

    if (result) {
      Object.assign(result, BaseSite.parseResult(result));
      return Object.assign(new MongoSite(null, null, null, false), result);
    }

    return null;
  }

  static delAll() {
    return MongoSite.builder.deleteMany({});
  }

  get id() {
    return this._id;
  }

  save() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      const result = await MongoSite.builder.insertOne(this.serialize());
      this._id = result.insertedId;

      // also save the site url as the first site resource at depth 0
      await this.saveResources([this.url], 0);

      resolve(this._id);
    });
  }

  update() {
    return MongoSite.builder.update({ _id: this.id }, this.serialize());
  }

  del() {
    return MongoSite.builder.deleteOne({ _id: this.id });
  }

  getResourceToCrawl() {
    // besides siteId, should also be crawlDelay, retry delays in order to create a more advanved resource where query
    return MongoResource.getResourceToCrawl(this.id);
  }

  saveResources(urls, depth) {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      // create a bloom filter for the current urls
      const newBloomFilter = BloomFilter.create(5000, 0.001);
      urls.forEach(url => newBloomFilter.add(url));

      /*
      update the stored filter (bitwise OR) and return the original stored filter
      can't do this: The $bit modifier field must be an Integer(32/64 bit);

      var originalSite = await Site.builder.findOneAndUpdate(
        { _id: this.id },
        { $bit: { resourceFilter: { or: newBloomFilter.bitset } } }
      );
      */

      // read and afterwards update the filter
      const originalSite = await MongoSite.builder.findOne({ _id: this.id }, { resourceFilter: 1 });
      const originalResourceFilter = originalSite.resourceFilter ? originalSite.resourceFilter.buffer : null;
      if (originalResourceFilter) {
        newBloomFilter.merge(originalResourceFilter);
      }

      await MongoSite.builder.updateOne(
        { _id: this.id },
        { $set: { resourceFilter: newBloomFilter.bitset } },
      );

      // filter urls against initial stored filter
      const originalBloomFilter = BloomFilter.create(5000, 0.001, originalResourceFilter);
      const resources = [];
      urls.forEach((url) => {
        if (originalBloomFilter.test(url) === false) {
          resources.push(new MongoResource(this.id, url, depth).serialize());
        }
      });

      /*
      save filtered resources - no failback,
      on error bloom filter will contain the urls and the pages will never be inserted again
      if present, insert resources
      */
      if (resources.length > 0) {
        await MongoResource.builder.insertMany(resources);
      }

      resolve();
    });
  }

  getResourceCount() {
    return MongoResource.count(this.id);
  }
}

module.exports = MongoSite;
