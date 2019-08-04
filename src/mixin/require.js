'use strict';
/* eslint-disable require-atomic-updates */
const { callsite } = require('../util');
const _ = require('underscore');
const path = require('path');
const Promise = require('bluebird');

const DEFAULT_REQUIRE_OPTS = {
  inline: true,
  shouldInject: true,
  data: {}
};

const Require = {
  _resolveCallSite(stack) {
    // Called from inject.require(...)
    //    Inject.require
    // -> callsite
    // Called from inject.pos.require(...)
    //    Inject.require
    //    Object.require
    // -> callsite
    let top = stack.shift();
    console.assert(top.functionName === 'Inject.require');
    top = stack.shift();
    if (top.functionName === 'Object.require') top = stack.shift();
    return top;
  },
  _resolveModule(cs, m) {
    let filePath = path.resolve(cs.file.dir, m);
    let module = path.parse(filePath);
    module.filePath = filePath;
    return module;
  },
  _loadModule: Promise.coroutine(function* (module, opts) {
    let { render } = this.hexo;
    // invoke hexo renderer
    // delay render if module will be served as a separate file
    module.content = opts.inline
      ? yield render.render({ path: module.filePath }, opts.data)
      : render.render({ path: module.filePath }, opts.data);
    module.ext = `.${render.getOutput(module.ext)}` || module.ext;
    // serve
    if (!opts.inline) opts.src = this.router.serve(module, opts);
    // wrap content
    module.content = yield this.loader.load(module, opts);
    // return rendered
    return module.content;
  }),
  require(pos, m, opts) {
    let cs = this._resolveCallSite(callsite());
    let module = this._resolveModule(cs, m);
    this.raw(pos, this._loadModule(module, opts), _.defaults({}, opts, DEFAULT_REQUIRE_OPTS));
  }
};

module.exports = Require;
