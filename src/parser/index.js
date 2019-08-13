'use strict';
const { INJECTION_POINTS, REGEX } = require('../const');
const { Block, Document } = require('./node');

let parser = null;
module.exports = class Parser {
  static get() {
    if (parser === null) parser = new Parser();
    return parser;
  }
  _parseRules(src, ruleNames = INJECTION_POINTS, defaultType = 'text') {
    const rules = ruleNames.map(i => REGEX[i]);

    let delta = 0;
    let { tokens, text } = rules.reduce((context, r, i) => {
      const ruleName = ruleNames[i];
      const [rule, pos] = ruleName.split('_');
      const isEnd = pos === 'end';
      const m = r.exec(context.text);
      if (m) {
        delta++;
        const tag = m[1];
        const offset = m.index;
        const before = context.text.substr(0, offset);
        context.text = context.text.substr(offset + tag.length);
        if (before !== '') {
          context.tokens.push({
            type: isEnd ? `${rule}_text` : defaultType,
            content: before
          });
        }
        context.tokens.push({
          type: ruleName,
          content: tag
        });
      }
      return context;
    }, { text: src, tokens: [] });

    if (text !== '') {
      if (delta === 0) {
        tokens.push({
          type: defaultType,
          content: text
        });
      } else {
        tokens = tokens.concat(this._parseRules(text, ruleNames, defaultType));
      }
    }
    return tokens;
  }
  _tokenize(src) {
    const tokens = this._parseRules(src);
    const INJECTION_REGION = ['injection_begin', 'injection_end'];

    const headIndex = tokens.findIndex(t => t.type === 'head_text');
    this._expandToken(tokens, headIndex, INJECTION_REGION);

    const bodyIndex = tokens.findIndex(t => t.type === 'body_text');
    this._expandToken(tokens, bodyIndex, INJECTION_REGION);

    return tokens;
  }
  _expandToken(tokens, index, ruleNames) {
    if (index < 0) return;
    const token = tokens[index];
    tokens.splice(index, 1, ...this._parseRules(token.content, ruleNames, token.type));
  }
  _reduceBlock(tokens) {
    const root = new Document();
    const stack = [root];
    const top = () => stack[stack.length - 1];

    tokens.forEach(token => {
      const [t, p] = token.type.split('_');
      switch (p) {
        case 'begin':
          stack.push(Block.make(t, token));
          break;
        case 'end': {
          const block = stack.pop();
          if (block.type !== t) throw new SyntaxError(`No matching '${t}_begin'`);
          block.end = token;
          top().append(block);
          break;
        }
        default:
          top().append(token);
      }
    });

    if (stack.length > 1) throw new SyntaxError(`No matching '${top().type}_end'`);

    return root;
  }
  parse(src) {
    const tokens = this._tokenize(src);
    const doc = this._reduceBlock(tokens);

    return doc;
  }
};
