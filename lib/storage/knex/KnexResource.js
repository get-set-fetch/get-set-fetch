const BaseResource = require('../base/BaseResource');

class KnexResource extends BaseResource {
  static get builder() {
    return KnexResource.knex('Resources');
  }

  static parseResult(result) {
    return {
      info: JSON.parse(result.info),
    };
  }

  static createTable(table) {
    table.increments('id').primary();
    table.integer('siteId');
    table.string('url');
    table.integer('depth');
    table.text('info');
    table.binary('content');
    table.string('contentType');
    table.dateTime('crawledAt');
    table.boolean('crawlInProgress');
  }

  static async get(urlOrId) {
    const colName = Number.isInteger(urlOrId) ? 'id' : 'url';
    const result = await KnexResource.builder.where(colName, urlOrId).first();

    if (result) {
      Object.assign(result, this.parseResult(result));
      return Object.assign(new KnexResource(), result);
    }
    return null;
  }

  /*
  within a transaction find a resource to crawl and set its crawlInProgress flag
  */
  static async getResourceToCrawl(siteId, crawlFrequency) {
    let resource = null;
    await KnexResource.knex.transaction(async (trx) => {
      // block SELECT FOR UPDATE execution of other concurrent transactions till the current one issues a COMMIT
      const result = await KnexResource.builder.transacting(trx).forUpdate()
        .where({
          siteId, crawlInProgress: false,
        })
        // eslint-disable-next-line func-names
        .andWhere(function () {
          if (crawlFrequency) {
            const rawTimeQuery = KnexResource.rawCrawlFrequencyQuery(crawlFrequency);
            if (rawTimeQuery) {
              this.where({ crawledAt: null }).orWhere('crawledAt', '<=', rawTimeQuery);
            }
            else {
              this.where({ crawledAt: null });
            }
          }
          else {
            this.where({ crawledAt: null });
          }
        })
        .first();
      if (result) {
        resource = Object.assign(new KnexResource(), result);
        resource.crawlInProgress = true;
        await KnexResource.builder.transacting(trx).where('id', resource.id).update('crawlInProgress', true);
      }
    });

    return resource;
  }

  static rawCrawlFrequencyQuery(crawlFrequency) {
    const dbClient = KnexResource.knex.client.config.client;
    let rawTimeQuery = null;
    switch (dbClient) {
      case 'mysql':
      case 'pg':
        rawTimeQuery = KnexResource.knex.raw(`NOW() - INTERVAL '${crawlFrequency}' HOUR`);
        break;
      case 'sqlite3':
        rawTimeQuery = KnexResource.knex.raw(`datetime('now','-${crawlFrequency} hour')`);
        break;
      default:
        rawTimeQuery = null;
    }

    return rawTimeQuery;
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
      // save the resource not using returning for sqlite since it does not support it
      if (KnexResource.knex.client.config.client === 'sqlite3') {
        this.id = parseInt(await KnexResource.builder.insert(this.serialize()), 10);
      }
      else {
        this.id = parseInt(await KnexResource.builder.returning('id').insert(this.serialize()), 10);
      }

      resolve(this.id);
    });
  }

  update() {
    this.crawlInProgress = false;
    return KnexResource.builder.where('id', this.id).update(this.serialize()).update('crawledAt', KnexResource.knex.fn.now());
  }


  del() {
    return KnexResource.builder.where('id', this.id).del();
  }
}

module.exports = KnexResource;
