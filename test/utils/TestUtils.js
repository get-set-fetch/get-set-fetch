const fs = require('fs');
const path = require('path');
const nock = require('nock');

class TestUtils {
  static getFilePaths(basePath) {
    let results = [];
    const childPaths = fs.readdirSync(basePath);
    childPaths.forEach((childPath) => {
      const fullPath = path.join(basePath, childPath);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(TestUtils.getFilePaths(fullPath));
      }
      else {
        results.push(fullPath);
      }
    });
    return results;
  }

  static fs2http(baseFilePath, baseWebPath) {
    const nockScopes = [];
    const filePaths = TestUtils.getFilePaths(baseFilePath);
    filePaths.forEach((filePath) => {
      const filePathSufix = filePath.replace(baseFilePath, '').replace('\\', '/');
      const nockScope = nock(baseWebPath)
        .persist()
        .get(filePathSufix).reply(
          200,
          fs.readFileSync(filePath),
          {
            'Content-Type': TestUtils.getContentType(path.extname(filePath)),
          },
        );

      nockScopes.push(nockScope);
    });

    return nockScopes;
  }

  static stopPersisting(nockScopes) {
    nockScopes.forEach((nockScope) => {
      nockScope.persist(false);
    });
    nock.cleanAll();
  }

  static getContentType(fileExt) {
    if (/^(.html|.htm)$/i.test(fileExt)) {
      return 'text/html; charset=utf-8';
    }

    if (/^.txt$/i.test(fileExt)) {
      return 'text/plain; charset=utf-8';
    }

    return '';
  }

  static emptyDir(dir) {
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i += 1) {
      fs.unlinkSync(path.join(dir, files[i]));
    }
  }

  // remove spaces and additional html tags added by chrome
  // additional tags for content-type text/html: html, head, body
  // additional tags for content-type text/plain: html, head, body, pre
  static stripChromeExtraTags(html) {
    return html.replace(/<\/*(html|head|body)>/g, '').replace(/\r?\n|\r|\s+/g, '');
  }
}

// add a require wrapper for get-set-fetch module
// eslint-disable-next-line import/no-dynamic-require
global.gsfRequire = name => require(path.join(__dirname, '..', '..', name));

module.exports = TestUtils;
