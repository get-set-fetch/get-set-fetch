# Moved

This module is obsoleted, a refactored version is available at [@get-set-fetch/scraper](https://github.com/get-set-fetch/scraper).

<img src="https://get-set-fetch.github.io/get-set-fetch/logo.png">


[![node](https://img.shields.io/node/v/get-set-fetch.svg)](https://github.com/get-set-fetch/get-set-fetch)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fget-set-fetch%2Fget-set-fetch?ref=badge_shield)
[![dependencies Status](https://david-dm.org/get-set-fetch/get-set-fetch/status.svg)](https://david-dm.org/get-set-fetch/get-set-fetch)
[![Known Vulnerabilities](https://snyk.io/test/github/get-set-fetch/get-set-fetch/badge.svg?targetFile=package.json)](https://snyk.io/test/github/get-set-fetch/get-set-fetch?targetFile=package.json)
[![Build Status](https://travis-ci.org/get-set-fetch/get-set-fetch.svg?branch=master)](https://travis-ci.org/get-set-fetch/get-set-fetch)
[![Coverage Status](https://coveralls.io/repos/github/get-set-fetch/get-set-fetch/badge.svg?branch=master)](https://coveralls.io/github/get-set-fetch/get-set-fetch?branch=master)

> Node.js web crawler and scrapper supporting various storage options under an extendable plugin system.

## Table of Contents
- [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [First crawl](#first-crawl)
- [Storage](#storage)
  * [SQL Connections](#sql-connections)
    * [SQLite](#sqlite)
    * [MySQL](#mysql)
    * [PostgreSQL](#postgresql)
  * [NoSQL Connections](#nosql-connections)
    * [MongoDB](#mongodb)
- [Site](#site)
  * [Site CRUD API](#site-crud-api)
    * [new Site(name, url, opts, createDefaultPlugins)](#site-crud-api)
    * [Site.get(nameOrId)](#sitegetnameorid)
    * [site.save()](#sitesave)
    * [site.update()](#siteupdate)
    * [site.del()](#sitedel)
    * [Site.delAll()](#sitedelall)
  * [Site Plugin API](#site-plugin-api)
      * [site.getPlugins()](#sitegetplugins)
      * [site.setPlugins(plugins)](#sitesetpluginsplugins)
      * [site.addPlugins(plugins)](#siteaddpluginsplugins)
      * [site.removePlugins(plugins)](#siteremovepluginsplugins)
      * [site.cleanupPlugins()](#sitecleanupplugins)
  * [Site Crawl API](#site-crawl-api)
      * [site.getResourceToCrawl()](#sitegetresourcetocrawl)
      * [site.saveResources(urls, depth)](#sitesaveresourcesurls-depth)
      * [site.getResourceCount()](#sitegetresourcecount)
      * [site.fetchRobots(reqHeaders)](#sitefetchrobotsreqheaders)
      * [site.crawlResource()](#sitecrawlresource)
      * [site.crawl(opts)](#sitecrawlopts)
      * [site.stop()](#sitestop)
- [Resource](#resource)
  * [Resource CRUD API](#resource-crud-api)
      * [new Resource(siteId, url, depth)](#resource-crud-api)
      * [Resource.get(urlOrId)](#resourcegeturlorid)
      * [resource.save()](#resourcesave)
      * [resource.update()](#resourceupdate)
      * [resource.del()](#resourcedel)
      * [Resource.delAll()](#resourcedelall)
  * [Resource Crawl API](#)
      * [Resource.getResourceToCrawl(siteId)](#resourcegetresourcetocrawlsiteid)
- [PluginManager](#pluginmanager)
  * [PluginManager.DEFAULT_PLUGINS](#pluginmanagerdefaultplugins)
  * [pluginManager.register(plugins)](#pluginmanagerregisterplugins)
  * [pluginManager.instantiate(jsonPlugins)](#pluginmanagerinstantiatejsonplugins)
- [Plugins](#plugins)
  * [Default Plugins](#default-plugins)
    * [SelectResourcePlugin](#selectresourceplugin)
    * [NodeFetchPlugin](#nodefetchplugin)
    * [JsDomPlugin](#jsdomplugin)
    * [ExtractUrlPlugin](#extracturlplugin)
    * [RobotsFilterPlugin](#robotsfilterplugin)
    * [UpdateResourcePlugin](#updateresourceplugin)
    * [InsertResourcePlugin](#insertresourceplugin)
  * [Optional Plugins](#optional-plugins)
    * [PersistResourcePlugin](#persistresourceplugin)
    * [ChromeFetchPlugin](#chromefetchplugin)
- [Logger](#logger)
  * [Logger.setLogLevel(logLevel)](#loggersetloglevelloglevel)
  * [Logger.setLogPaths(outputPath, errorPath)](#loggersetlogpathsoutputpath-errorpath)
  * [Logger.getLogger(cls)](#loggergetloggercls)
- [Additional Documentation](#additional-documentation)

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

#### PostgreSQL
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

### Site CRUD API

#### new Site(name, url, opts, createDefaultPlugins)
- `name` &lt;string> site name
- `url` &lt;string> site url
- `opts` &lt;Object> site options
  - `resourceFilter` &lt;Object> bloom filter settings for filtering duplicate urls
    - `maxEntries` &lt;number> maximum number of expected unique urls. Defaults to `5000`.
    - `probability` &lt;number> probability an url is erroneously marked as duplicate. Defaults to `0.01`.
- `createDefaultPlugins` &lt;boolean> indicate if the default plugin set should be added to the site. Defaults to `true`.
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

### Site Plugin API

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

### Site Crawl API

#### site.getResourceToCrawl()
- returns <Promise<[Resource]>>  
#### site.saveResources(urls, depth)
- `urls` <Array&lt;String>> urls of the resources to be added
- `depth` &lt;Number> depth of the resources to be added
- returns &lt;Promise>  
The urls are filtered against the site bloom filter in order to remove duplicates.
#### site.getResourceCount()
- returns <Promise<&lt;number>>  total number of site resources
#### site.fetchRobots(reqHeaders)
- `reqHeaders` &lt;Object>  
Retrieves the site robots.txt content via <NodeFetchPlugin> and updates the site robotsTxt property.
- returns &lt;Promise>
#### site.crawlResource()
- Loops through the ordered (based on phase) plugins and apply each one to the current site-resource pair. The first plugin in the SELECT phase is responsible for retrieving the resource to be crawled.
#### site.crawl(opts)
- `opts` &lt;Object> crawl options
  - `maxConnections` &lt;number> maximum number of resources crawled in parallel. Defaults to `1`.
  - `maxResources` &lt;number> If set, crawling will stop once the indicated number of resources has been crawled.
  - `maxDepth` &lt;number> If set, crawling will stop once there are no more resources with a lower than indicated depth.
  - `delay` &lt;number> delay in miliseconds between consecutive crawls. Defaults to `100`.
Each time a resource has finished crawling attempt to restore maximum number of parallel connections in case new resources have been found and saved. Crawling stops and the returned promise is resolved once there are no more resources to crawl meeting the above criteria.
- returns &lt;Promise>
#### site.stop()
- No further resource crawls are initiated. The one in progress are completed.
- returns &lt;Promise>

## Resource

### Resource CRUD API

#### new Resource(siteId, url, depth)
- `siteId` &lt;string> id of the site the resource belongs to
- `url` &lt;string> resource url
- `depth` &lt;number> resource depth. First site resource has depth 0.
#### Resource.get(urlOrId)
- `urlOrId` &lt;string> resource url or id
- returns <Promise<[Resource]>>  
#### resource.save()
- returns <Promise&lt;number>> the newly created resource id  
#### resource.update()
- returns &lt;Promise>
#### resource.del()
- returns &lt;Promise>
#### Resource.delAll()
- returns &lt;Promise>

### Resource Crawl API

#### Resource.getResourceToCrawl(siteId)
- `siteId` &lt;string> resource will belong to the specified site id
returns <Promise<[Resource]>>


## PluginManager

#### PluginManager.DEFAULT_PLUGINS
- returns <Array<[BasePlugin]>> default plugins

#### pluginManager.register(plugins)
- `plugins` <Array<[BasePlugin]>|[BasePlugin]> registered plugins can later be instantiated from JSON strings retrieved from storage.

#### pluginManager.instantiate(jsonPlugins)
- `plugins` <Array<[string]>|[string]> instantiate plugin(s) from their corresponding JSON strings
- returns <Array<[BasePlugin]>|[BasePlugin]> plugin instance(s)


## Plugins

### Default Plugins

#### SelectResourcePlugin
- Selects a resource to crawl from the current site.
#### NodeFetchPlugin
- Downloads a site resource using node HTTP and HTTPS libraries.
#### JsDomPlugin
- Generates a jsdom document for the current resource.
#### ExtractUrlPlugin
- Responsible for extracting new resources from a resource document.
#### RobotsFilterPlugin
- Filters newly found resources based on robots.txt rules.
#### UpdateResourcePlugin
- Updates a resource after crawling it.
#### InsertResourcePlugin
- Saves newly found resource within the current site.

### Optional Plugins

#### PersistResourcePlugin
-  Writes a resources to disk.
#### ChromeFetchPlugin
- Alternative to <[NodeFetchPlugin]>, instead of just downloading a site resource it also executes the javascript code (if present) returning the dynamically generated html content. Uses Puppeteer to control headless Chrome which needs to be installed separately:  
```npm install puppeteer --save```


## Logger

#### Logger.setLogLevel(logLevel)
- `logLevel` &lt;trace|debug|info|warn|error> set desired log level, levels below it will be ignored. Defaults to warn.
#### Logger.setLogPaths(outputPath, errorPath)
- `outputPath` &lt;string> path for the output log
- `errorPath` &lt;string> path for the error log
#### Logger.getLogger(cls)
- `cls` &lt;string> class  / category to be appended on each log message. A log entry has the following elements: [LogLevel] [Class] [Date] [Message]. All console methods can be invoked: trace, debug, info, warn, error.
- returns <[Logger]>

## Additional Documentation
Read the [full documentation](https://getsetfetch.org) for more details.



[Site]: #site  "Site"
[Resource]: #resource  "Resource"
[BasePlugin]: #baseplugin  "BasePlugin"

[ChromeFetchPlugin]: #chromefetchplugin "ChromeFetchPlugin"
[NodeFetchPlugin]: #nodefetchplugin "NodeFetchPlugin"

[Logger]: #logger  "Logger"







