require('chai/register-assert');
const fs = require('fs');

const RobotsFilterPlugin = gsfRequire('lib/plugins/process/RobotsFilterPlugin');

describe('Test RobotsFilterPlugin', () => {
  let rfp = null;

  it('scenario simple-singlegroup-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/simple-singlegroup-robots.txt', 'utf8'),
    });
    assert.equal(Object.keys(rfp.groups).length, 1);
    const gr1 = rfp.groups['*'];
    assert.notEqual(gr1, undefined);
    assert.equal(gr1.directives.length, 1);
    assert.equal(gr1.directives[0].rule, 'allow');
    assert.equal(gr1.directives[0].pattern.toString(), '/(.*)/');
    assert.equal(gr1['crawl-delay'], 10);
  });

  it('scenario simple-multiplegroup-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/simple-multiplegroup-robots.txt', 'utf8'),
    });
    assert.equal(Object.keys(rfp.groups).length, 3);

    ['a', 'b'].forEach((agent) => {
      const gr = rfp.groups[agent];
      assert.notEqual(gr, undefined);
      assert.equal(gr.directives.length, 1);
      assert.equal(gr.directives[0].rule, 'allow');
      assert.equal(gr.directives[0].pattern.toString(), '/(.*)/');
      assert.equal(gr['crawl-delay'], 10);
    });

    const gr3 = rfp.groups.c;
    assert.notEqual(gr3, undefined);
    assert.equal(gr3.directives.length, 1);
    assert.equal(gr3.directives[0].rule, 'allow');
    assert.equal(gr3.directives[0].pattern, '/c');
    assert.equal(gr3['crawl-delay'], 5);
  });

  it('scenario simple-empty-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/simple-empty-robots.txt', 'utf8'),
    });
    assert.equal(rfp.canCrawl('/a', 'botA'), true);
    assert.equal(rfp.canCrawl('/b', 'botB'), true);
  });

  it('scenario disallow-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/disallow-robots.txt', 'utf8'),
    });
    assert.equal(rfp.canCrawl('/suba', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/', 'botA'), false);
    assert.equal(rfp.canCrawl('/root.html', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/subc', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/subc/a.html', 'botA'), false);

    assert.equal(rfp.canCrawl('/index.html', 'botA'), true);
    assert.equal(rfp.canCrawl('/sub2', 'botA'), true);
    assert.equal(rfp.canCrawl('/sub2/suba.html', 'botA'), true);
  });

  it('scenario mixed-allow-disallow-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/mixed-allow-disallow-robots.txt', 'utf8'),
    });
    assert.equal(rfp.canCrawl('/suba/specific/', 'botA'), true);
    assert.equal(rfp.canCrawl('/suba/specific/index.html', 'botA'), true);

    assert.equal(rfp.canCrawl('/suba', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/index.html', 'botA'), false);
  });

  it('scenario mixed-allow-disallow-regexp-robots.txt', () => {
    rfp = new RobotsFilterPlugin({
      content: fs.readFileSync('./test/unit/plugins/process/robots/mixed-allow-disallow-regexp-robots.txt', 'utf8'),
    });
    assert.equal(rfp.canCrawl('/index.html', 'botA'), true);
    assert.equal(rfp.canCrawl('/suba/', 'botA'), true);
    assert.equal(rfp.canCrawl('/suba/index.html', 'botA'), true);

    assert.equal(rfp.canCrawl('/other/other.php', 'botA'), false);
    assert.equal(rfp.canCrawl('/index.php', 'botA'), false);
    assert.equal(rfp.canCrawl('/suba/index.php3', 'botA'), false);

    assert.equal(rfp.canCrawl('/end/index.txt', 'botA'), false);
    assert.equal(rfp.canCrawl('/end/index.txt?a=1', 'botA'), true);
    assert.equal(rfp.canCrawl('/end/index', 'botA'), true);

    /*
        Disallow: /*.php
        Disallow: /suba/*.php3
        Disallow: /end/*.php$
        Allow: /end/*

        */
  });
});
