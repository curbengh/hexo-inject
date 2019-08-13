'use strict';
const { extname } = require('path');
const Promise = require('bluebird');

function buildFilterArguments(result) {
  const render = this._render;
  const ctx = render.context;
  const ext = extname(this.path);
  const output = render.getOutput(ext) || ext;
  return [
    'after_render:' + output,
    result,
    {
      context: ctx,
      args: [{
        path: this.source,
        text: this.data._content
      }]
    }
  ];
}

module.exports = function(View) {
  View.prototype._precompile = function() {
    const renderer = this._render.getRenderer(extname(this.path));
    const data = {
      path: this.source,
      text: this.data._content
    };

    if (typeof renderer.compile === 'function') {
      const compiled = renderer.compile(data);

      this._compiledSync = function(locals) {
        const ctx = this._render.context;
        const { log } = ctx;
        const result = compiled(locals);
        log.debug('[hexo-inject] patched execFilterSync("after_render")');
        return ctx.execFilterSync.apply(ctx, buildFilterArguments.call(this, result));
      };

      this._compiled = function(locals) {
        const ctx = this._render.context;
        const { log } = ctx;
        return Promise.resolve(compiled(locals))
          .then(result => {
            log.debug('[hexo-inject] patched execFilter("after_render")');
            return ctx.execFilter.apply(ctx, buildFilterArguments.call(this, result));
          });
      };
    } else {
      this._compiledSync = function(locals) {
        return this._render.renderSync(data, locals);
      };

      this._compiled = function(locals) {
        return this._render.render(data, locals);
      };
    }
  };
};
