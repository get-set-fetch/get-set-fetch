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
      } else {
        results.push(fullPath);
      }
    });
    return results;
  }

  static fs2http(baseFilePath, baseWebPath) {
    const filePaths = TestUtils.getFilePaths(baseFilePath);
    filePaths.forEach((filePath) => {
      const filePathSufix = filePath.replace(baseFilePath, '');
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
}

module.exports = TestUtils;
