const Url = require('url');

const BasePlugin = require('../base/BasePlugin');

/**
 * Plugin responsible for filtering new resources based on robots.txt rules.
 */
class RobotsFilterPlugin extends BasePlugin {
  constructor(opts) {
    super(opts);
    if (this.opts && Object.prototype.hasOwnProperty.call(this.opts, 'content')) {
      this.groups = {};
      this.parse(this.opts.content);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getPhase() {
    return BasePlugin.PHASE.POST_PROCESS;
  }

  // eslint-disable-next-line class-methods-use-this
  test() {
    return true;
  }

  apply(site, resource) {
    // only attemp to filter resource if there are some present
    if (!resource.urlsToAdd || resource.urlsToAdd.length === 0) {
      return {};
    }

    return { urlsToAdd: this.filterUrls(site, resource) };
  }

  filterUrls(site, resource) {
    /*
    1st time urls are filtered for this site, parse the site robots.txt
    during a crawling session, a site has the same instance of every plugin registered to it
    */
    if (!this.groups) {
      this.groups = {};
      this.parse(site.robotsTxt || '');
    }

    const userAgent = resource.requestHeaders ? resource.requestHeaders['User-Agent'] : '';

    // extract path from url, so all robots comparison is done without the domain name
    return resource.urlsToAdd.filter(urlToAdd => this.canCrawl(Url.parse(urlToAdd).path, userAgent));
  }

  parse(content) {
    let currentAgents = [];
    let prevAgent = null;

    content.split(/\r\n|\r|\n/).forEach((line) => {
      const pair = line.split(':');

      // exactly one key:value pair
      if (pair.length !== 2) return;

      // both prop and val are defined
      const prop = pair[0].trim().toLowerCase();
      const val = pair[1].trim().toLowerCase();
      if (!prop || !val) return;

      // form groups based on user-agent
      if (prop === 'user-agent') {
        const agent = val;
        this.groups[val] = this.groups[val] || { directives: [] };

        if (prevAgent) {
          currentAgents.push(agent);
        }
 else {
          currentAgents = [agent];
        }
        prevAgent = agent;
      }
 else {
        prevAgent = null;

        switch (prop) {
          case 'allow':
          case 'disallow':
            this.addDirective(currentAgents, prop, val);
            break;
          case 'crawl-delay':
            this.addProperty(currentAgents, prop, parseInt(val, 10));
            break;
          default:
        }
      }
    });
  }

  addDirective(agents, rule, pattern) {
    agents.forEach((agent) => {
      this.groups[agent].directives.push({ rule, pattern: RobotsFilterPlugin.parsePattern(pattern) });
    });
  }

  addProperty(agents, prop, val) {
    agents.forEach((agent) => {
      this.groups[agent][prop] = val;
    });
  }

  static parsePattern(patternStr) {
    // regexp
    if (patternStr.indexOf('*') !== -1 || patternStr.indexOf('$') !== -1) {
      // const special = /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g;
      const special = /[-[\]/{}()+?.\\^$|]/g;
      const wildcard = /\*/g;
      const eol = /\\\$$/;

      const patternRegExp = patternStr
        .replace(special, '\\$&')
        .replace(wildcard, '(.*)')
        .replace(eol, '$');

      return new RegExp(patternRegExp);
    }

    // regular string
    return patternStr;
  }

  canCrawl(path, userAgent) {
    const group = this.groups[userAgent] || this.groups['*'] || {};

    // by default there are no restrictions
    if (!Object.keys(group).length) {
      return true;
    }

    let matchedPattern = '';
    let allow = true;
    group.directives.some((directive) => {
      const { pattern } = directive;

      // match longest string
      if (typeof pattern === 'string') {
        if (path.indexOf(pattern) === 0 && matchedPattern.length < pattern.length) {
          allow = directive.rule === 'allow';
          matchedPattern = pattern;
        }
      }
 else if (pattern.test(String(path))) {
        // match first regexp pattern
        allow = directive.rule === 'allow';
        // exit the parse loop
        return true;
      }

      // continue the parse loop
      return false;
    });

    return allow;
  }
}

module.exports = RobotsFilterPlugin;
