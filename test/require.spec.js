'use strict';

require('chai').use(require('chai-as-promised')).should();
const sinon = require('sinon');

const Hexo = require('hexo');
const Inject = require('../src/inject');
const path = require('path');

describe('Require', () => {
  const hexo = new Hexo(__dirname);
  const inject = new Inject(hexo);
  beforeEach(() => sinon.stub(inject, 'raw'));
  afterEach(() => inject.raw.restore());
  const swig_asset = './asset/foo.swig';
  const js_asset = './asset/foo.js';
  const css_asset = './asset/foo.css';
  const mock_module = (p, content) => {
    const m_path = path.resolve(__dirname, p);
    const m = path.parse(m_path);
    m.filePath = m_path;
    if (content != null) {
      m.content = content;
    }
    return m;
  };
  it('should resolve module path from callsite', () => {
    sinon.stub(inject, '_loadModule');
    const m = mock_module(js_asset);
    try {
      inject.require('test', js_asset);
      inject.headBegin.require(js_asset);
      inject._loadModule.calledTwice.should.be.true;
      const m1 = inject._loadModule.getCall(0).args[0];
      const m2 = inject._loadModule.getCall(1).args[0];
      m1.should.eql(m);
      m1.should.eql(m2);
    } finally {
      inject._loadModule.restore();
    }
  });
  describe('render', () => {
    before(() => hexo.init());
    it('should render content with hexo renderer', () => {
      const m = mock_module(swig_asset);
      return inject._loadModule(m, {
        inline: true,
        data: { test: 'foo' }
      }).should.become('this is a foo\n');
    });
    it('should replace module extension name with output\'s', () => {
      const m = mock_module(swig_asset);
      return inject._loadModule(m, {
        inline: true,
        data: { test: 'foo' }
      }).then(() => m.ext.should.equal('.html'));
    });
    it('should delay render if opts.inline == false', () => {
      const m = mock_module(swig_asset);
      return inject._loadModule(m, {
        inline: false,
        data: { test: 'foo' }
      }).should.become('').then(() => {
        const route_data = inject.router._routes[0].data;
        route_data.should.be.a('function');
        return route_data();
      }).should.become('this is a foo\n');
    });
  });
  describe('loader', () => {
    it('should returns as-is if not available', () => {
      const m = mock_module(swig_asset, 'foo content');
      return inject.loader.load(m, { inline: true }).should.become('foo content');
    });
    it('should should have empty content if opts.inline == false', () => {
      const m = mock_module(swig_asset, 'foo content');
      return inject.loader.load(m, { inline: false }).should.become('');
    });
    it('built-in .js loader opts.inline == true', () => {
      const m = mock_module(js_asset, 'var foo = 1;');
      return inject.loader.load(m, { inline: true }).should.become('<script>var foo = 1;</script>');
    });
    it('built-in .js loader opts.inline == false', () => {
      const m = mock_module(js_asset, 'var foo = 1;');
      const opts = { inline: false, src: '/injected/foo.js' };
      return inject.loader.load(m, opts).should.become(`<script src='${opts.src}'></script>`);
    });
    it('built-in .css loader opts.inline == true', () => {
      const m = mock_module(css_asset, 'body { display: none; }');
      return inject.loader.load(m, { inline: true }).should.become('<style>body { display: none; }</style>');
    });
    it('built-in .css loader opts.inline == false', () => {
      const m = mock_module(css_asset, 'body { display: none; }');
      const opts = { inline: false, src: '/injected/foo.css' };
      return inject.loader.load(m, opts).should.become(`<link rel='stylesheet' href='${opts.src}'>`);
    });
    return it('custom loader', () => {
      inject.loader.register('.foo', (content, opts) => `FOO ${content} OOF`);
      const m = mock_module('./asset/foo.foo', 'bar');
      return inject.loader.load(m, { inline: true }).should.become('FOO bar OOF');
    });
  });
  describe('serve', () => {
    beforeEach(() => { inject.router._routes = []; });
    it('should serve when opts.inline == false', () => {
      const m = mock_module(swig_asset);
      return inject._loadModule(m, {
        inline: false,
        data: {
          test: 'foo'
        }
      }).should.become('').then(() => {
        inject.router._routes.should.be.an('array').of.length(1);
        const route = inject.router._routes[0];
        route.path.should.equal('/injected/foo.html');
        const route_data = route.data;
        route_data.should.be.a('function');
        return route_data();
      }).should.become('this is a foo\n');
    });
    it('should not serve when opts.inline == true', () => {
      const m = mock_module(swig_asset);
      return inject._loadModule(m, {
        inline: true,
        data: { test: 'foo' }
      }).then(() => {
        inject.router._routes.should.be.an('array').of.length(0);
      });
    });
  });
});
