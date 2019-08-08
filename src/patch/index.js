'use strict';
const path = require('path');
const ViewPatch = require('./view');

module.exports = function patch(hexo) {
  function requireSiteModule(m) {
    return require(path.join(hexo.base_dir, 'node_modules/', m));
  }

  let { log } = hexo;
  // eslint-disable-next-line radix
  let [major, minor] = hexo.version.split('.').map((v) => parseInt(v));
  if (major === 3 && minor === 2) {
    log.info('[hexo-inject] installing hotfix for hexojs/hexo#1791');
    // eslint-disable-next-line new-cap
    ViewPatch(requireSiteModule('hexo/lib/theme/view'));
  }
};
