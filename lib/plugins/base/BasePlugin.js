/* eslint-disable no-unused-vars, class-methods-use-this */
/**
 * Plugin contract to be implemented by all plugins.
 */
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

  getPriority() {
    const phases = ['select', 'fetch', 'process', 'save'];
    const subPhases = ['pre', '', 'post'];

    const phaseParts = this.getPhase().split('-');
    if (phaseParts.length === 1) {
      phaseParts.unshift('');
    }

    return parseInt(String(phases.indexOf(phaseParts[1]) + String(subPhases.indexOf(phaseParts[0]))), 10);
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

  toJSON() {
    return {
      name: this.constructor.name,
      opts: this.opts,
    };
  }
}

module.exports = BasePlugin;

