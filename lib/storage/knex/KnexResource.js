const BaseResource = require.main.require('lib/storage/base/BaseResource');

class KnexResource extends BaseResource {
  static get builder() {
    return KnexResource.knex('Resources');
  }

  static createTable(table) {
    table.increments('id').primary();
    table.integer('siteId');
    table.string('url');
    table.integer('depth');
    table.json('content');
    table.dateTime('crawledAt');
  }

  static async get(urlOrId) {
    const colName = Number.isInteger(urlOrId) ? 'id' : 'url';
    const result = await KnexResource.builder.where(colName, urlOrId).first();
    return result ? Object.assign(new KnexResource(), result) : null;
  }

  static getResourceToCrawl(siteId) {
    return KnexResource.builder.where({ siteId, crawledAt: null }).first();
  }

  static delAll() {
    return KnexResource.builder.del();
  }

  static insert(resources, trx) {
    return trx ? KnexResource.builder.transacting(trx).insert(resources) : KnexResource.builder.insert(resources);
  }

  static async count(siteId) {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      const result = await KnexResource.builder.where('siteId', siteId).count('* as c').first();
      resolve(result.c);
    });
  }

  save() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(async (resolve, reject) => {
      this.id = parseInt(await KnexResource.builder.insert(this.serialize()), 10);
      resolve(this.id);
    });
  }

  update() {
    return KnexResource.builder.where('id', this.id).update(this.serialize());
  }

  del() {
    return KnexResource.builder.where('id', this.id).del();
  }
}

module.exports = KnexResource;
