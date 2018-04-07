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
    const filePaths = TestUtils.getFilePaths(baseFilePath);
    filePaths.forEach((filePath) => {
      const filePathSufix = filePath.replace(baseFilePath, '').replace('\\', '/');
      // console.log(`${baseWebPath + filePathSufix} ${TestUtils.getContentType(path.extname(filePath))}`);
      nock(baseWebPath)
        // .persist()
        .get(filePathSufix).reply(
          200,
          fs.readFileSync(filePath),
          {
            'Content-Type': TestUtils.getContentType(path.extname(filePath)),
          },
        );
    });
  }

  static getContentType(fileExt) {
    if (/^(.html|.htm)$/i.test(fileExt)) {
      return 'text/html; charset=utf-8';
    }

    return '';
  }

  static emptyDir(dir) {
    const files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i += 1) {
      fs.unlinkSync(path.join(dir, files[i]));
    }
  }

  // remove spaces and header, chrome adds an empty header even if none is present in the original document
  static sanitize(html) {
    return html.replace(/<head>.*<\/head>/g, '').replace(/\r?\n|\r|\s+/g, '');
  }
}

// add a require wrapper for get-set-fetch module
// eslint-disable-next-line import/no-dynamic-require
global.gsfRequire = name => require(path.join(__dirname, '..', '..', name));

module.exports = TestUtils;
