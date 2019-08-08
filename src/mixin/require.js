'use strict';
const { callsite, isRequireStack } = require('../util');
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
    //    Object.require / Object.args [as require]
    // -> callsite
    let top = stack.shift();
    console.assert(top.functionName === 'Inject.require');
    top = stack.shift();
    if (isRequireStack(top)) top = stack.shift();
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
    module.ext = `.${render.getOutput(module.ext)}` || module.ext;

    let content;

    // invoke hexo renderer
    // delay render if module will be served as a separate file
    if (opts.inline) {
      content = yield render.render({ path: module.filePath }, opts.data);
    } else {
      content = render.render({ path: module.filePath }, opts.data);
    }

    /* eslint-disable require-atomic-updates */

    module.content = content;

    // serve
    if (!opts.inline) opts.src = this.router.serve(module, opts);

    // wrap content
    module.content = yield this.loader.load(module, opts);

    // return rendered
    return module.content;

    /* eslint-enable require-atomic-updates */
  }),
  require(pos, m, opts) {
    let cs = this._resolveCallSite(callsite());
    let module = this._resolveModule(cs, m);
    this.raw(pos, this._loadModule(module, opts), Object.assign({}, DEFAULT_REQUIRE_OPTS, opts));
  }
};

module.exports = Require;
