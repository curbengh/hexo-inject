'use strict';
const _ = require('underscore');
const { Content, Register, Transform, Require } = require('./mixin');
const { INJECTION_POINTS, API } = require('./const');
const { camalize } = require('./util');
const Loader = require('./loader');
const Router = require('./router');
const registerBuiltInLoader = require('./loader/built-in');

class Inject {
  constructor (hexo) {
    this.hexo = hexo
    this.loader = new Loader(hexo)
    registerBuiltInLoader(this.loader)
    this.router = new Router(hexo)
    this._initAPI()
  }
  _initAPI () {
    this._injectors = {}
    INJECTION_POINTS.forEach((i) => {
      this._injectors[i] = []
      let api = this[camalize(i)] = _.chain(this)
        .pick(API)
        .mapObject((fn) => (...args) => {
          fn.call(this, i, ...args)
          return api
        })
        .value()
    })
  }
}

Object.assign(Inject.prototype, Content, Register, Transform, Require);

module.exports = Inject;
