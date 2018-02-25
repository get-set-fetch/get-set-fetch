const fs = require('fs');
const nock = require('nock');

class TestUtils {
  static getFilePaths(path) {
    let results = [];
    const childPaths = fs.readdirSync(path);
    childPaths.forEach((childPath) => {
      const fullPath = `${path}/${childPath}`;
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
        .get(filePathSufix).reply(200, fs.readFileSync(filePath));
    });
  }
}

module.exports = TestUtils;
