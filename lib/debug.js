'use strict';

/**
 * Module dependencies
 */

var ansi = require('ansi-styles');


function makeBold(str) {
  var re = /\#\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
  var match = re.exec(str);
  if (match) {
    return wrap(match[1], 'bold');
  }
  return str;
}

function wrap(str, color) {
  return ansi[color].open
    + str + ansi[color].close;
}

function debug (type) {
  var bug = require('debug')(type);
  return function () {
    var args = [].slice.call(arguments);
    args[0] = makeBold(args[0]);
    return bug.apply(bug, args);
  };
}

/**
 * Export `debug` namespaces
 */

module.exports = {
  delims: debug('template:delims'),
  engine: debug('template:engine'),
  helper: debug('template:helper'),
  layout: debug('template:layout'),
  parser: debug('template:parser'),
  render: debug('template:render'),
  template: debug('template:template'),
  utils: debug('template:utils')
};
