'use strict';
global.Hexo = require('hexo');

// GLOBAL.fs = require('hexo-fs')
const chai = require('chai');

global.chai = chai;

global.expect = chai.expect;

global.should = chai.should;

chai.should();

chai.use(require('chai-as-promised'));
