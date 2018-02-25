const URL = require('url');

class UrlUtils {
  static extractPathOrigin(strUrl) {
    const urlInfo = URL.parse(strUrl);
    return `${urlInfo.protocol}//${urlInfo.host}`;
  }
}

module.exports = UrlUtils;
