require('chai/register-assert');

const ExtractUrlPlugin = require.main.require('lib/plugins/process/ExtractUrlPlugin');
const JsDomPlugin = require.main.require('lib/plugins/process/JsDomPlugin');

describe('Test ExtractUrlPlugin', () => {
  let extractUrlPlugin = null;
  let jsDomPlugin = null;
  let site = null;

  beforeEach(() => {
    extractUrlPlugin = new ExtractUrlPlugin();
    jsDomPlugin = new JsDomPlugin();
    site = { url: 'http://site.com' };
  });

  it('extract links: internal, relative to root path, no subdomains', () => {
    const htmlContent =
      '<body>' +
        "<a href='http://site.com/page1.html'>a1</a>" +
        "<a href='page2.html'>a2</a>" +
        "<a href='/a/page3.html'>a3</a>" +
        "<a href='./b/page4.html'>a3</a>" +
      '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(4, extractedUrls.length);

    const expectedLinks = [
      'http://site.com/page1.html',
      'http://site.com/page2.html',
      'http://site.com/a/page3.html',
      'http://site.com/b/page4.html',
    ];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  it('extract links: internal, relative to subpath, no subdomains', () => {
    const htmlContent =
      '<body>' +
        "<a href='http://site.com/page1.html'>a1</a>" +
        "<a href='page2.html'>a2</a>" +
        "<a href='/a/page3.html'>a3</a>" +
        "<a href='./b/page4.html'>a3</a>" +
        "<a href='../page5.html'>a3</a>" +
        "<a href='../c/page6.html'>a3</a>" +
      '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/dir1/subPage.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(6, extractedUrls.length);

    const expectedLinks = [
      'http://site.com/page1.html',
      'http://site.com/dir1/page2.html',
      'http://site.com/a/page3.html',
      'http://site.com/dir1/b/page4.html',
      'http://site.com/page5.html',
      'http://site.com/c/page6.html',
    ];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  it('extract links: ignore external links', () => {
    const htmlContent =
      '<body>' +
        "<a href='http://site2.com/page1.html'>a1</a>" +
        "<a href='http://1.site2.com/page2.html'>a2</a>" +
        "<a href='http://2.site3.com/page3.html'>a2</a>" +
      '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(0, extractedUrls.length);
  });

  it('extract links: ignore multiple links with # suffix', () => {
    const htmlContent =
      '<body>' +
        "<a href='page1.html#b1'>a1</a>" +
        "<a href='page1.html#b2'>a2</a>" +
      '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(1, extractedUrls.length);

    const expectedLinks = ['http://site.com/page1.html'];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  it('extract links: by default ignore "non-html" resources', () => {
    const htmlContent =
      '<body>' +
        "<a href='page1.html'>a1</a>" +
        "<a href='/page2'>a2</a>" +
        "<a href='/page3.gif'>a3</a>" +
        "<a href='/page4.php'>a4</a>" +
      '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(3, extractedUrls.length);

    const expectedLinks = ['http://site.com/page1.html', 'http://site.com/page2', 'http://site.com/page4.php'];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  it('extract links: only "image" resources from anchor tags', () => {
    const htmlContent =
      '<body>' +
        "<a href='img1.gif'>a1</a>" +
        "<a href='img2.png'>a1</a>" +
        "<a href='img3.jpg'>a1</a>" +
        "<a href='/page2'>a2</a>" +
        "<a href='/page3.html'>a3</a>" +
        "<a href='/page4.php'>a4</a>" +
      '</body>';

    extractUrlPlugin.opts.extensionRe = /^(gif|png|jpg|jpeg|jpe)$/i;
    extractUrlPlugin.opts.allowNoExtension = false;

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(3, extractedUrls.length);

    const expectedLinks = ['http://site.com/img1.gif', 'http://site.com/img2.png', 'http://site.com/img3.jpg'];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  it('extract links: only "image" resources from img tags', () => {
    const htmlContent =
      '<body>' +
        "<img src='img1.gif'/>" +
        "<img src='img2.png'/>" +
        "<img src='img3.jpg'/>" +
        "<img src='img4.unknown'/>" +
        "<a href='/page2'>a2</a>" +
        "<a href='/page3.html'>a3</a>" +
        "<a href='/page4.php'>a4</a>" +
      '</body>';

    extractUrlPlugin.opts.extensionRe = /^(gif|png|jpg|jpeg|jpe)$/i;
    extractUrlPlugin.opts.allowNoExtension = false;

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(3, extractedUrls.length);

    const expectedLinks = ['http://site.com/img1.gif', 'http://site.com/img2.png', 'http://site.com/img3.jpg'];
    expectedLinks.forEach((expectedLink) => {
      assert.include(extractedUrls, expectedLink);
    });
  });

  /*
  hostname = sub.host.com, different subdomain, different hostname
  each "Site" model represents a single hostname

  modify the API by adding a flag whether or not subdomains are regarded as internal or external links
  maybe add the flag at Site model
  for now, subdomains are treated as external
  */

  it('extract links: add internal links different subdomain', () => {
    const htmlContent = '<body>' +
            "<a href='http://sub1.site.com/page1.html'>a1</a>" +
            "<a href='http://www.site.com/page2.html'>a2</a>" +
            '</body>';

    const extractedUrls = extractUrlPlugin.extractResourceUrls(site, {
      url: 'http://site.com/index.html',
      document: jsDomPlugin.genDocument({ rawData: htmlContent }),
    });
    assert.strictEqual(0, extractedUrls.length);
  });
});
