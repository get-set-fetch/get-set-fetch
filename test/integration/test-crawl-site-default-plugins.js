require('chai/register-assert');

const connections = require.main.require('test/config/connections.json');


connections.forEach((conn) => {
  /*
  pages:
    index.html contains links to: pageA.html
    pageA.html contains links to: pageA.html, pageB.html
    pageB.html contains links to: pageA.html, pageB.html, extra/pageC.html
    extra/pageC.html contains links to: pageA.html, extra/pageD.html

    robots.txt restricts crawling of ./extra subdir
  */
  xdescribe(`Test Crawl Site - default plugins, using connection ${conn.info}`, () => {
  });
});
