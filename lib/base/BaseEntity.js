
/* eslint-disable no-unused-vars, class-methods-use-this */
class BaseEntity {
  static get builder() {
    throw new Error('not implemented!');
  }

  static async get(urlOrId) {
    throw new Error('not implemented!');
  }

  static insert(resources, trx) {
    throw new Error('not implemented!');
  }

  static delAll() {
    throw new Error('not implemented!');
  }

  static async count(siteId) {
    throw new Error('not implemented!');
  }

  save() {
    throw new Error('not implemented!');
  }

  update() {
    throw new Error('not implemented!');
  }

  del() {
    throw new Error('not implemented!');
  }

  get props() {
    throw new Error('not implemented!');
  }

  serialize() {
    return this.props.reduce((acc, key) => Object.assign(acc, { [key]: this[key] }), {});
  }
}

module.exports = BaseEntity;
