const KnexStorage = gsfRequire('lib/storage/knex/KnexStorage');
const GetSetFetch = gsfRequire('lib/index');
const PluginManager = gsfRequire('lib/plugins/PluginManager');
const ExternalStorageTests = gsfRequire('test/external/external-storage-tests');

const conn = {
  info: 'knex with mysql 5.7',
  client: 'mysql',
  useNullAsDefault: true,
  debug: false,
  connection: {
    host: 'localhost',
    port: 33060,
    user: 'get-set-fetch-user',
    password: 'get-set-fetch-pswd',
    database: 'get-set-fetch-db',
  },
};

/* functions needed by some tests, can't achieve the logic just using the Resource API */
function updateCrawledAt(KnexResource, resourceId, deltaHours) {
  const rawTimeQuery = KnexResource.knex.raw(`NOW() - INTERVAL '${deltaHours}' HOUR`);
  return KnexResource.builder.where('id', resourceId).update('crawledAt', rawTimeQuery);
}

function resetCrawlInProgress(KnexResource, resourceId) {
  return KnexResource.builder.where('id', resourceId)
    .update({ crawlInProgress: false });
}

function checkInitialCrawledAt(crawledAt) {
  assert.strictEqual(crawledAt, null);
}

const ResourceFncs = {
  updateCrawledAt,
  resetCrawlInProgress,
  checkInitialCrawledAt,
};

describe('Test Suite MySQL Storage', () => {
  Object.values(ExternalStorageTests).forEach((suite) => {
    suite(GetSetFetch, PluginManager, KnexStorage, conn, ResourceFncs);
  });
});
