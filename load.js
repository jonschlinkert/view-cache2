var _ = require('lodash');


function Loader(cache) {
  this.cache = cache || {};
}

Loader.prototype.set = function (key, value) {
  this.cache[key] = this.normalize(value);
  return this;
};

Loader.prototype.load = function () {
  var args = [].slice.call(arguments);
  var last = args[args.length - 1];
  var multiple = false;

  if (typeof last === 'boolean') {
    multiple = last;
  }
  if (multiple) {
    this.loadMany.apply(this, args);
  } else {
    this.loadOne.apply(this, args);
  }
  return this;
};

Loader.prototype.loadOne = function (key, value) {
  var args = [].slice.call(arguments);
  var last = args[args.length - 1];

  this.set(key, value);

  return this;
};

Loader.prototype.loadMany = function (key, value) {
  var args = [].slice.call(arguments);
  var last = args[args.length - 1];
  this.set(key, value);

  return this;
};

Loader.prototype.get = function (key) {
  return this.cache[key];
};

Loader.prototype.normalize = function (value) {
  return value;
};





var template = new Loader();

template.loadOne('a.md', 'foo bar baz');
template.loadMany({'b.md': {data: {title: 'b'}, content: 'B content', layout: 'foo.md'}})

console.log(template)
