'use strict';
const isObject = require('lodash/isObject');
const clone = require('lodash/clone');
const { createHash } = require('crypto');

const wrap = (type, content) => {
  // If content is another token, clone it and change the type
  if (isObject(content) && typeof content.type === 'string') {
    content = clone(content);
    content.type = type;
    return content;
  }
  // Wrap as token
  return { type, content };
};

class Node {
  constructor(type) {
    this.type = type;
    this.children = [];
  }
  get content() {
    return this.children.map(c => c.content).join('');
  }
  get firstChild() {
    return this.children.length === 0 ? null : this.children[0];
  }
  get lastChild() {
    return this.children.length === 0 ? null : this.children[this.children.length - 1];
  }
  prepend(content) {
    // if (_.isArray(content)) return content.forEach(this.prepend.bind(this))
    this.children.unshift(content);
  }
  append(content) {
    // if (_.isArray(content)) return content.forEach(this.append.bind(this))
    this.children.push(content);
  }
  clear() {
    this.children = [];
  }
}

class Block extends Node {
  static make(type, begin, end) {
    const T = Block.TYPES[type];
    return T ? new T(begin, end) : new Block(type, begin, end);
  }
  constructor(type, begin, end) {
    super(type || 'block');
    this.begin = begin;
    this.end = end;
  }
  get content() {
    return this.begin.content + super.content + this.end.content;
  }
  validate() {
    const { children } = this;
    if (children.length <= 2) return true;
    for (var i = 1; i < children.length - 1; i++) {
      if (children[i].type === 'injection') return false;
    }
    return true;
  }
  injectBefore(content) {
    let { firstChild } = this;
    if (firstChild === null || firstChild.type !== 'injection') {
      // eslint-disable-next-line no-use-before-define
      firstChild = new InjectionBlock();
      this.prepend(firstChild);
    }
    firstChild.append(content);
  }
  injectAfter(content) {
    let { lastChild } = this;
    if (lastChild === null || lastChild.type !== 'injection') {
      // eslint-disable-next-line no-use-before-define
      lastChild = new InjectionBlock();
      this.append(lastChild);
    }
    lastChild.append(content);
  }
  clearInjections() {
    const { firstChild, lastChild } = this;
    if (firstChild !== null && firstChild.type === 'injection') firstChild.clear();
    if (lastChild !== null && lastChild.type === 'injection') lastChild.clear();
  }
}

const INJECTION_BEGIN = wrap('injection_begin', '<!-- hexo-inject:begin -->');
const INJECTION_END = wrap('injection_end', '<!-- hexo-inject:end -->');

class InjectionBlock extends Block {
  constructor(begin = INJECTION_BEGIN, end = INJECTION_END) {
    super('injection', begin, end);
    this._contentHash = {};
  }
  _ensureUniqueContent(node) {
    const hasher = createHash('md5');
    const { content } = node;
    hasher.update(content);
    const hash = hasher.digest('hex');
    if (this._contentHash[hash]) return false;
    this._contentHash[hash] = node;
    return true;
  }
  prepend(content) {
    if (Array.isArray(content)) return content.forEach(this.prepend.bind(this));
    content = wrap('injection_text', content);
    if (this._ensureUniqueContent(content)) super.prepend(content);
  }
  append(content) {
    if (Array.isArray(content)) return content.forEach(this.append.bind(this));
    content = wrap('injection_text', content);
    if (this._ensureUniqueContent(content)) super.append(content);
  }
  injectBefore(content) {
    this.prepend(content);
  }
  injectAfter(content) {
    this.append(content);
  }
  clear() {
    super.clear();
    this._contentHash = {};
  }
}

Block.TYPES = {
  'injection': InjectionBlock
};

class Document extends Node {
  constructor() {
    super('document');
  }
  get head() {
    return this.children.find(({ type }) => type === 'head');
  }
  get body() {
    return this.children.find(({ type }) => type === 'body');
  }
  get isComplete() {
    return typeof this.head === 'object' && typeof this.body === 'object';
  }
}

module.exports.wrap = wrap;
module.exports.Node = Node;
module.exports.Block = Block;
module.exports.InjectionBlock = InjectionBlock;
module.exports.Document = Document;
