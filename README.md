[![node](https://img.shields.io/node/v/get-set-fetch.svg)](https://github.com/get-set-fetch/get-set-fetch)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch?ref=badge_shield)
[![dependencies Status](https://david-dm.org/get-set-fetch/get-set-fetch/status.svg)](https://david-dm.org/get-set-fetch/get-set-fetch)
[![Known Vulnerabilities](https://snyk.io/test/github/get-set-fetch/get-set-fetch/badge.svg?targetFile=package.json)](https://snyk.io/test/github/get-set-fetch/get-set-fetch?targetFile=package.json)
[![Build Status](https://travis-ci.org/get-set-fetch/get-set-fetch.svg?branch=master)](https://travis-ci.org/get-set-fetch/get-set-fetch)
[![Coverage Status](https://coveralls.io/repos/github/get-set-fetch/get-set-fetch/badge.svg?branch=master)](https://coveralls.io/github/get-set-fetch/get-set-fetch?branch=master)

# get-set, Fetch!


> nodejs web crawler and scrapper supporting various storage options under an extendable plugin system

## Table of Contents
- [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [First crawl](#first-crawl)
- [Storage](#storage)
  * [SQL Connections](#sql-connections)
    * [SQLite](#storage)
    * [MySQL](#storage)
    * [Postgresql](#storage)
  * [NoSQL Connections](#nosql-connections)
    * [MongoDB](#storage)
- [Site](#site)
  * [new Site(name, url, opts, createDefaultPlugins)](#site)
  * [CRUD API](#crud-api)
    * [Site.get(nameOrId)](#sitegetnameorid)
    * [site.save()](#sitesave)
    * [site.update()](#siteupdate)
    * [site.del()](#sitedel)
    * [Site.delAll()](#sitedelall)
  * [Plugin API](#)
    * [getPlugins()](#getPlugins)
    * [setPlugins([plugins])](#getPlugins)
    * [addPlugins([plugins])](#getPlugins)
    * [removePlugins([plugins])](#getPlugins)
    * [cleanupPlugins()](#)
  * [Crawl API](#)
    * [getResourceToCrawl()](#)
    * [saveResources(urls, depth)](#)
    * [getResourceCount()](#)
    * [fetchRobots(reqHeaders)](#)
    * [crawlResource()](#)
    * [crawl()](#)
    * [stop()](#)
- [Resource](#)
    * [new Resource(siteId, url, depth)](#)
    * [CRUD API](#)
      * [get(urlOrId)](#)
      * [save()](#)
      * [update()](#)
      * [del()](#)
      * [delAll()](#)
    * [Crawl API](#)
      * [getResourceToCrawl(siteId)](#)
- [PluginManager](#)
  * [DEFAULT_PLUGINS](#)
  * [register](#)
  * [instantiate](#)
- [Plugins](#)
  * [Default](#)
    * [SelectResourcePlugin](#)
    * [NodeFetchPlugin](#)
    * [JsDomPlugin](#)
    * [ExtractUrlPlugin](#)
    * [RobotsFilterPlugin](#)
    * [UpdateResourcePlugin](#)
    * [InsertResourcePlugin](#)
  * [Optional](#)
    * [PersistResourcePlugin](#)
    * [ChromeFetchPlugin](#)
  * [Write a custom plugins](#)
- [Scenarios](#)
  * [Image Scrapper](#)
  * [Static Content Scrapper](#)
  * [Dynamic Content Scrapper](#)
  * [Periodic Crawling](#)




## Getting Started

### Prerequisites
get-set-fetch handles all async operations via javascript es6 async / await syntax. It requires at least node 7.10.1. 

### Installation
Install get-set-fetch module  
```npm install get-set-fetch --save```

Install knex, sqlite3 in order to use the default sqlite:memory storage.  
```npm install knex sqlite3 --save```

### First Crawl
```javascript
// import the get-set-fetch dependency
const GetSetFetch = require('get-set-fetch');

/*
the entire code is async,
declare an async function in order to make use of await
*/
async function firstCrawl() {
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
firstCrawl();
```

The above example uses a set of default plugins capable of crawling html content. Once firstCrawl completes, all site html resources have been crawled assuming they are discoverable from the initial url.

## Storage

### SQL Connections

#### SQLite
Default storage option if none provided consuming the least amount of resources.  

Requires knex and sqlite driver.   
```npm install knex sqlite3 --save```  

Init storage:
```
const { Site } = await GetSetFetch.init({
  "client": "sqlite3",
  "useNullAsDefault": true,
  "connection": {
      "filename": ":memory:"
  }
});
```

#### MySQL
Requires knex and mysql driver.  
```npm install knex mysql --save```

Init storage:
```
const { Site } = await GetSetFetch.init({
  "client": "mysql",
  "useNullAsDefault": true,
  "connection": {
    "host" : "localhost",
    "port": 33060,
    "user" : "get-set-fetch-user",
    "password" : "get-set-fetch-pswd",
    "database" : "get-set-fetch-db"
  }
});
```

#### Postgresql
Requires knex and postgresql driver.  
```npm install knex pg --save```

Init storage:
```
const { Site } = await GetSetFetch.init({
  "client": "pg",
  "useNullAsDefault": true,
  "connection": {
    "host" : "localhost",
    "port": 54320,
    "user" : "get-set-fetch-user",
    "password" : "get-set-fetch-pswd",
    "database" : "get-set-fetch-db"
  }
});
```

### NoSQL Connections

#### MongoDB
Requires mongodb driver.  
```npm install mongodb --save```

Init storage:
```
const { Site } = await GetSetFetch.init({
  "url": "mongodb://localhost:27027",
  "dbName": "get-set-fetch-test"
});
```

## Site

### new Site (name, url, opts, createDefaultPlugins)
- `name` &lt;string> site name
- `url` &lt;string> site url
- `opts` &lt;Object> site options
  - `resourceFilter` &lt;Object]> bloom filter settings for filtering duplicate urls
    - `maxEntries` &lt;number> maximum number of expected unique urls. Defaults to `5000`.
    - `probability` &lt;number> probability an url is eronately marked as duplicate. Defaults to `0.01`.
- `createDefaultPlugins` &lt;boolean> indicate if the default plugin set should be added to the site. Defaults to `true`.

### CRUD API

#### Site.get(nameOrId)
- `nameOrId` &lt;string> site name or id
- returns <Promise<[Site]>>  
#### site.save()
- returns <Promise<&lt;number>> the newly created site id  
When a new site is created, its url is also saved as the first site resource at depth 0.
#### site.update()
- returns &lt;Promise>
#### site.del()
- returns &lt;Promise>
#### Site.delAll()
- returns &lt;Promise>

### Plugin API

#### site.getPlugins()
- returns <Array<[BasePlugin]>> the plugins used for crawling.
#### site.setPlugins(plugins)
- `plugins` <Array<[BasePlugin]>> the plugins to be used for crawling.   
The existing ones are removed.
#### site.addPlugins(plugins)
- `plugins` <Array<[BasePlugin]>> additional plugins to be used for crawling.  
The existing plugins are kept unless an additional plugin is of the same type as an existing plugin. In this case the additional plugin overwrites the existing one.
#### site.removePlugins(pluginNames)
- pluginNames <Array&lt;String>> constructor names of the plugins to be removed  
Remove the matching plugins from the existing ones.
#### site.cleanupPlugins()
 - Some plugins (like [ChromeFetchPlugin]) open external processes. Each plugin is responsible for its own cleanup via plugin.cleanup(). 



Read the [full documentation](https://getsetfetch.org) for more details.



[Site]: #site  "Site"
[BasePlugin]: #baseplugin  "BasePlugin"
[ChromeFetchPlugin]: #chromefetchplugin "ChromeFetchPlugin"









