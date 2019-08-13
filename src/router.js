'use strict';
module.exports = class Router {
  constructor(hexo) {
    this.hexo = hexo;
    this._routes = [];
  }
  register() {
    const { generator } = this.hexo.extend;
    generator.register('inject', locals => this._routes);
  }
  serve(module, opts) {
    const src = opts.src || `/injected/${module.name}${module.ext}`;
    const { content } = module;
    this._routes.push({ path: src, data: () => content });
    return src;
  }
};
