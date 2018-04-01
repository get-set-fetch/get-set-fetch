[![node](https://img.shields.io/node/v/get-set-fetch.svg)](https://github.com/get-set-fetch/get-set-fetch)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch?ref=badge_shield)
[![dependencies Status](https://david-dm.org/get-set-fetch/get-set-fetch/status.svg)](https://david-dm.org/get-set-fetch/get-set-fetch)
[![Known Vulnerabilities](https://snyk.io/test/github/get-set-fetch/get-set-fetch/badge.svg?targetFile=package.json)](https://snyk.io/test/github/get-set-fetch/get-set-fetch?targetFile=package.json)
[![Build Status](https://travis-ci.org/get-set-fetch/get-set-fetch.svg?branch=master)](https://travis-ci.org/get-set-fetch/get-set-fetch)
[![Coverage Status](https://coveralls.io/repos/github/get-set-fetch/get-set-fetch/badge.svg?branch=master)](https://coveralls.io/github/get-set-fetch/get-set-fetch?branch=master)

# get-set, Fetch!
nodejs web crawler and scrapper supporting various storage options under an extendable plugin system. 

## Getting Started

### Prerequisites
get-set-fetch handles all async operations via javascript es6 async / await syntax. It requires at least node 7.10.1. 

### Installation
Install get-set-fetch module  
```npm install get-set-fetch --save```

Install knex, sqlite3 in order to use the default sqlite:memory storage.  
```npm install knex sqlite3 --save```

### Crawl a website
```javascript
// import the get-set-fetch dependency
const GetSetFetch = require('get-set-fetch');

/*
the entire code is async,
declare an async function in order to make use of await
*/
async function simpleCrawl() {
  // init db connection, by default in memory sqlite
  const { Site } = await GetSetFetch.init();

  /*
  load site if already present,
  otherwise create it by specifying a name and the first url to crawl,
  only links from this location down will be subject to further crawling
  */
  let site = await Site.get('simpleSite');
  if (!site) {
    site = new Site(
      'simpleSite',
      'https://simpleSite/',
    );

    await site.save();
  }

  // keep crawling the site until there are no more resources to crawl
  await site.crawl();
}

// start crawling
simpleCrawl();
```

The above example uses a set of default plugins capable of crawling html content. Once simpleCrawl completes, all site html resources have been crawled assuming they are discoverable from the initial url.

Read the [full documentation](https://getsetfetch.org) for more details.








