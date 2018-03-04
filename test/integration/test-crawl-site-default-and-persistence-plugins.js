require('chai/register-assert');
const fs = require('fs');
const path = require('path');

const connections = require.main.require('test/config/connections.json');
const TestUtils = require.main.require('test/utils/TestUtils');
const GetSetFetch = require.main.require('lib/index.js');

connections.forEach((conn) => {
  /*
  pages:
    index.html contains links to: pageA.html, getsetfetch1.png
    pageA.html contains links to: pageA.html, getsetfetch2.gif, getsetfetch3.jpg
  */
  describe(`Test Crawl Site - default and persistence plugins, using connection ${conn.info}`, () => {
    let Site = null;
    let site = null;

    const targetDir = './test/tmp';

    const emptyDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (let i = 0; i < files.length; i += 1) {
        fs.unlinkSync(path.join(dir, files[i]));
      }
    };

    before(async () => {
      ({ Site } = await GetSetFetch.init(conn));
    });

    beforeEach(async () => {
      // cleanup fs
      emptyDir(targetDir);

      // cleanup db
      await Site.delAll();

      // save site
      site = new Site('siteA', 'http://www.site1.com/index.html', { 'User-Agent': 'custom-user-agent' });
      await site.save();

      // configure nock to serve fs files
      TestUtils.fs2http('test/integration/crawl-site-default-and-persistence-plugin', 'http://www.site1.com');

      // fetch and save robots.txt
      await site.fetchRobots();
      assert.strictEqual('#', site.robotsTxt);
    });

    after(() => {
      GetSetFetch.close();
    });

    it('crawl all png resources', async () => {
      /*
      by default ExtractUrlPlugin only extracts html resources
      overide the default plugin instance with a new one containing suitable options
      */
      site.use(new GetSetFetch.plugins.ExtractUrlPlugin({ extensionRe: /^(html|png)$/i }));

      // add persistencePlugin to the current site
      site.use(new GetSetFetch.plugins.PersistResourcePlugin({
        target: targetDir,
        extensionRe: /^png$/i,
      }));

      // crawl the entire site
      await site.crawl();

      // verify one file exists in target, is png
      const genFiles = fs.readdirSync(targetDir);
      assert.strictEqual(1, genFiles.length);
      assert.strictEqual('.png', path.extname(genFiles[0]));
    });

    it('crawl all image resourcess', async () => {
      /*
      by default ExtractUrlPlugin only extracts html resources
      overide the default plugin instance with a new one containing suitable options
      */
      site.use(new GetSetFetch.plugins.ExtractUrlPlugin({ extensionRe: /^(html|png|gif|jpg)$/i }));

      // add persistencePlugin to the current site
      site.use(new GetSetFetch.plugins.PersistResourcePlugin({
        target: targetDir,
        extensionRe: /^(png|gif|jpg)$/i,
      }));

      // crawl the entire site
      await site.crawl();

      // verify files are correctly generated
      const genFiles = fs.readdirSync(targetDir);
      assert.strictEqual(3, genFiles.length);

      const expectedImages = ['getsetfetch-1.png', 'getsetfetch-2.gif', 'getsetfetch-3.jpg'];
      expectedImages.forEach((expectedImage) => {
        assert.include(genFiles, expectedImage);
      });
    });
  });
});
