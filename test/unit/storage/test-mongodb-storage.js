const MongoStorage = gsfRequire('lib/storage/mongo/MongoStorage');
const GetSetFetch = gsfRequire('lib/index');
const ExternalStorageTests = gsfRequire('test/external/external-storage-tests');

const conn = {
  info: 'mongoDB',
  url: 'mongodb://localhost:27027',
  dbName: 'get-set-fetch-test',
};

/* functions needed by some tests, can't achieve the logic just using the Resource API */
function updateCrawledAt(MongoResource, resourceId, deltaHours) {
  return MongoResource.builder.update(
    { _id: resourceId },
    {
      $set: {
        crawledAt: new Date(Date.now() - (deltaHours * 60 * 60 * 1000)),
      },
    },
  );
}

function resetCrawlInProgress(MongoResource, resourceId) {
  return MongoResource.builder.update(
    { _id: resourceId },
    {
      $set: {
        crawlInProgress: false,
      },
    },
  );
}

function checkInitialCrawledAt(crawledAt) {
  assert.strictEqual(crawledAt, null);
}

const ResourceFncs = {
  updateCrawledAt,
  resetCrawlInProgress,
  checkInitialCrawledAt,
};

describe('Test Suite MongoDB Storage', () => {
  Object.values(ExternalStorageTests).forEach((suite) => {
    suite(GetSetFetch, MongoStorage, conn, ResourceFncs);
  });
});
