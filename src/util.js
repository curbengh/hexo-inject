'use strict';
const { REGEX } = require('./const');
const { parse } = require('path');

module.exports.camalize = str => {
  return str.split('_')
    .filter(s => s.length > 0)
    .map((s, i) => { return i === 0 ? s : s[0].toUpperCase() + s.substr(1); })
    .join('');
};

module.exports.callsite = () => {
  return new Error().stack
    .split('\n').slice(2) // First line is 'Error', second line is this function
    .map(token => {
      let [, functionName, alias, filePath, line, col] = REGEX.stack_trace.exec(token);
      const file = parse(filePath);

      line = parseInt(line, 10);
      col = parseInt(col, 10);

      return {
        functionName, alias,
        filePath, file,
        line, col
      };
    });
};

module.exports.isRequireStack = stack => {
  return (
    stack.functionName === 'Object.require'
    || ( // For Node.js 8 and Node.js 10
      stack.functionName === 'Object.args' && stack.alias === 'require'
    )
  );
};
