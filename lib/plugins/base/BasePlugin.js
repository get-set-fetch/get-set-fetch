/* eslint-disable no-unused-vars, class-methods-use-this */
class BasePlugin {
  constructor(opts) {
    this.opts = opts || {};
  }

  static get PHASE() {
    return {
      PRE_SELECT: 'pre-select',
      SELECT: 'select',
      POST_SELECT: 'post-select',

      PRE_FETCH: 'pre-fetch',
      FETCH: 'fetch',
      POST_FETCH: 'post-fetch',

      PRE_PROCESS: 'pre-process',
      PROCESS: 'process',
      POST_PROCESS: 'post-process',

      PRE_SAVE: 'pre-save',
      SAVE: 'save',
      POST_SAVE: 'post-save',
    };
  }

  static getPluginPriority(plugin) {
    const phases = ['select', 'fetch', 'process', 'save'];
    const subPhases = ['pre', '', 'post'];

    const phaseParts = plugin.getPhase().split('-');
    if (phaseParts.length === 1) {
      phaseParts.unshift('');
    }

    return parseInt(String(phases.indexOf(phaseParts[1]) + String(subPhases.indexOf(phaseParts[0]))), 10);
  }

  static orderPlugins(plugins) {
    return plugins.sort((p1, p2) => BasePlugin.getPluginPriority(p1) - BasePlugin.getPluginPriority(p2));
  }

  getPhase() {
    throw new Error(`not implemented! ${this.constructor.name}`);
  }

  test() {
    throw new Error(`not implemented! ${this.constructor.name}`);
  }

  apply() {
    throw new Error(`not implemented! ${this.constructor.name}`);
  }
}

module.exports = BasePlugin;

