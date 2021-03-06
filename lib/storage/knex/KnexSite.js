const BaseSite = require('../base/BaseSite');
const BloomFilter = require('../../filters/bloom/BloomFilter');
const KnexResource = require('./KnexResource');

class KnexSite extends BaseSite {
  static get builder() {
    return KnexSite.knex('Sites');
  }

  static createTable(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('url');
    table.text('opts');
    table.binary('resourceFilter');
    table.text('robotsTxt');
    table.text('plugins');
  }

  static async get(nameOrId) {
    const colName = Number.isInteger(nameOrId) ? 'id' : 'name';
    const result = await KnexSite.builder.where(colName, nameOrId).first();
    if (result) {
      Object.assign(result, BaseSite.parseResult(result));
      return Object.assign(new KnexSite(null, null, null, false), result);
    }
    return null;
  }

  static delAll() {
    return KnexSite.builder.del();
  }

  save() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      // save the site not using returning for sqlite since it does not support it
      if (KnexResource.knex.client.config.client === 'sqlite3') {
        this.id = parseInt(await KnexSite.builder.insert(this.serialize()), 10);
      }
      else {
        this.id = parseInt(await KnexSite.builder.returning('id').insert(this.serialize()), 10);
      }

      // also save the site url as the first site resource at depth 0
      await this.saveResources([this.url], 0);
      resolve(this.id);
    });
  }

  update() {
    return KnexSite.builder.where('id', this.id).update(this.serialize());
  }

  del() {
    return KnexSite.builder.where('id', this.id).del();
  }

  getResourceToCrawl(crawlFrequency) {
    // besides siteId, should also be crawlDelay, retry delays in order to create a more advanved resource where query
    return KnexResource.getResourceToCrawl(this.id, crawlFrequency);
  }

  saveResources(urls, depth) {
    return KnexSite.knex.transaction(async (trx) => {
      // read the latest resource filter bitset
      const { resourceFilter } = (
        await KnexSite.builder.transacting(trx).forUpdate()
          .select('resourceFilter').where('id', this.id)
          .first()
      );
      const resourceFilterOpts = this.opts.resourceFilter;
      const bloomFilter = BloomFilter.create(resourceFilterOpts.maxEntries, resourceFilterOpts.probability, resourceFilter);

      // create new resources
      const resources = [];
      urls.forEach((url) => {
        if (bloomFilter.test(url) === false) {
          resources.push(new KnexResource(this.id, url, depth).serialize());
          bloomFilter.add(url);
        }
      });

      // if present, save filtered resources
      if (resources.length > 0) {
        await KnexResource.insert(resources, trx);
      }

      // update bloomFilter
      await KnexSite.builder.transacting(trx).where('id', this.id).update('resourceFilter', bloomFilter.bitset);
    });
  }

  async getResourceCount() {
    return parseInt(await KnexResource.count(this.id), 10);
  }
}

module.exports = KnexSite;
