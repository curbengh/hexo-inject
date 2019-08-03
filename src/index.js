'use strict';
const Inject = require('./inject');
const patch = require('./patch');

patch(hexo)
new Inject(hexo).register()
