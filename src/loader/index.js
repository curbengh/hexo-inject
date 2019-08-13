'use strict';
const Promise = require('bluebird');

module.exports = class Loader {
  constructor(hexo) {
    this.hexo = hexo;
    this._loaders = Object.create(null);
  }
  register(ext, loader) {
    if (!this._loaders[ext]) this._loaders[ext] = [];
    this._loaders[ext].push(loader);
  }
  load(module, opts) {
    const content = opts.inline ? module.content : '';
    return Promise.reduce(this._loaders[module.ext] || [], (content, loader) => loader(content, opts), content);
  }
};
