'use strict';
const { REGEX } = require('./const');
const path = require('path');

module.exports.camalize = function camalize(str) {
  return str.split('_')
    .filter((s) => s.length > 0)
    .map((s, i) => { return i === 0 ? s : s[0].toUpperCase() + s.substr(1); })
    .join('');
};

module.exports.callsite = function callsite() {
  function parse(t) {
    let [, functionName, alias, filePath, line, col] = REGEX.stack_trace.exec(t);
    let file = path.parse(filePath);

    // eslint-disable-next-line radix
    line = parseInt(line);
    // eslint-disable-next-line radix
    col = parseInt(col);

    return {
      functionName, alias,
      filePath, file,
      line, col
    };
  }
  let stack = new Error().stack
    .split('\n').slice(2) // First line is 'Error', second line is this function
    .map(parse);

  return stack;
};
