const URL = require('url-parse');

class UrlUtils {
  static extractPathOrigin(strUrl) {
    const urlInfo = new URL(strUrl);
    return `${urlInfo.protocol}//${urlInfo.host}`;
  }
}

module.exports = UrlUtils;
