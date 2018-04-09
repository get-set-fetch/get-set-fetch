require('chai/register-assert');
const fs = require('fs');
const path = require('path');

const connections = gsfRequire('test/config/connections.json');
const pluginConfigurations = gsfRequire('test/config/plugin-configurations');
const TestUtils = gsfRequire('test/utils/TestUtils');
const GetSetFetch = gsfRequire('lib/index.js');

connections.forEach((conn) => {
  pluginConfigurations.forEach((pluginConf) => {
    /*
    pages:
      index.html contains links to: pageA.html, getsetfetch1.png
      pageA.html contains links to: pageA.html, getsetfetch2.gif, getsetfetch3.jpg
    */
    describe('Test Scenario: save image resources using persistence plugin\n' +
      `using db connection: ${conn.info}\n` +
      `using plugin configuration: ${pluginConf.info}`, () => {
      let Site = null;
      let site = null;

      const targetDir = './test/tmp';

      before(async () => {
        ({ Site } = await GetSetFetch.init(conn));
      });

      beforeEach(async () => {
        // cleanup fs
        TestUtils.emptyDir(targetDir);

        // cleanup db
        await Site.delAll();

        // save site
        site = new Site('siteA', 'http://www.site1.com/index.html', { 'User-Agent': 'custom-user-agent' });
        await site.save();

        // configure nock to serve fs files
        TestUtils.fs2http(path.join('test', 'integration', 'crawl-site-default-and-persistence-plugin'), 'http://www.site1.com');

        // fetch and save robots.txt
        await site.fetchRobots();
        assert.strictEqual('#', site.robotsTxt);

        // set plugin configuration
        // site.plugins = pluginConf.plugins;
      });

      after(async () => {
        GetSetFetch.close();

        // temp fix until destroy is automatically invoked on each site plugin after crawl completes
        if (site.plugins[1].destroy) {
          await site.plugins[1].destroy();
        }

        /*
        tmp has .gitkeep file in order to create the tmp directory on git checkout
        recreate after tmp cleanp
        */
        fs.closeSync(fs.openSync(path.join(targetDir, '.gitkeep'), 'w'));
      });

      it('crawl all png resources', async () => {
        /*
        by default ExtractUrlPlugin only extracts html resources
        overide the default plugin instance with a new one containing suitable options
        */
        site.addPlugins([new GetSetFetch.plugins.ExtractUrlPlugin({ extensionRe: /^(html|png)$/i })]);

        // add persistencePlugin to the current site
        site.addPlugins([new GetSetFetch.plugins.PersistResourcePlugin({
          target: targetDir,
          extensionRe: /^png$/i,
        })]);

        // crawl the entire site
        await site.crawl();

        const expectedImages = ['getsetfetch-1.png'];

        // verify correct number of files have been generated
        const genFiles = fs.readdirSync(targetDir);
        assert.strictEqual(expectedImages.length, genFiles.length);

        // verify the generated files have the correct content
        expectedImages.forEach((expectedImage) => {
          const expectedBuffer = fs.readFileSync(path.join(
            'test', 'integration', 'crawl-site-default-and-persistence-plugin',
            expectedImage,
          ));
          const actualBuffer = fs.readFileSync(path.join('test', 'tmp', expectedImage));
          assert.strictEqual(true, expectedBuffer.equals(actualBuffer), 'incorrect generated file content');
        });
      });

      it('crawl all image resourcess', async () => {
        /*
        by default ExtractUrlPlugin only extracts html resources
        overide the default plugin instance with a new one containing suitable options
        */
        site.addPlugins([new GetSetFetch.plugins.ExtractUrlPlugin({ extensionRe: /^(html|png|gif|jpg)$/i })]);

        // add persistencePlugin to the current site
        site.addPlugins([new GetSetFetch.plugins.PersistResourcePlugin({
          target: targetDir,
          extensionRe: /^(png|gif|jpg)$/i,
        })]);

        // crawl the entire site
        await site.crawl();

        const expectedImages = ['getsetfetch-1.png', 'getsetfetch-2.gif', 'getsetfetch-3.jpg'];

        // verify correct number of files have been generated
        const genFiles = fs.readdirSync(targetDir);
        assert.strictEqual(expectedImages.length, genFiles.length);

        // verify the generated files have the correct content
        expectedImages.forEach((expectedImage) => {
          const expectedBuffer = fs.readFileSync(path.join(
            'test', 'integration', 'crawl-site-default-and-persistence-plugin',
            expectedImage,
          ));
          const actualBuffer = fs.readFileSync(path.join('test', 'tmp', expectedImage));
          assert.strictEqual(true, expectedBuffer.equals(actualBuffer), 'incorrect generated file content');
        });
      });
    });
  });
});
