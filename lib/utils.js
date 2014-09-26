'use strict';

var path = require('path');
var deepPick = require('deep-pick');
var extend = require('mixin-deep');
var hasAny = require('has-any');
var isEmpty = require('is-empty');
var omit = require('omit-keys');
var omitEmpty = require('omit-empty');
var pick = require('object-pick');
var prettify = require('js-beautify').html;
var rootKeys = require('./root-keys');
var slice = require('array-slice');
var uniqueId = require('uniqueid');
var arrayify = require('arrayify-compact');
var _ = require('lodash');


/**
 * Expose `utils`
 *
 * @type {Object}
 */

var utils = module.exports;

var hasOwn = utils.hasOwn = _.has;

utils.arrayify = arrayify;
utils.deepPick = deepPick;
utils.pick = pick;
utils.omit = omit;


/**
 * Utility for returning the native `typeof` a value.
 *
 * @param  {*} `val`
 * @return {*}
 */

var typeOf = utils.typeOf = function(val) {
  return {}.toString.call(val).toLowerCase()
    .replace(/\[object ([\S]+)\]/, '$1');
};

var isString = utils.isString = function(val) {
  return utils.typeOf(val) === 'string';
};

var isObject = utils.isObject = function(val) {
  return utils.typeOf(val) === 'object';
};

var isFunction = utils.isFunction = function(val) {
  return utils.typeOf(val) === 'function';
};

var isNumber = utils.isNumber = function(val) {
  return utils.typeOf(val) === 'number';
};


/**
 * Omit `keys` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.baseOmit = function(o, keys) {
  return o == null ? {} : omit(o, keys);
};


/**
 * Pick `keys` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.basePick = function(o, keys) {
  return o == null ? {} : pick(o, keys);
};


/**
 * Pick `rootKeys` from `object`.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.pickRoot = function(o) {
  return utils.basePick(o, rootKeys);
};


/**
 * Pick `locals` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.pickLocals = function(o) {
  var root = utils.baseOmit(o, rootKeys);
  return extend({}, root, pick(o, 'locals'));
};


/**
 * Pick `options` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.pickOptions = function(o) {
  return utils.basePick(o, 'options');
};


/**
 * Determine the correct layout to use for the given `value`.
 *
 * @param  {Object} `value` File object to test search for `layout`.
 * @return {String} The name of the layout to use.
 * @api private
 */

utils.pickLayout = function (value) {
  return utils.pickFrom(value, 'layout', ['data', 'locals', 'options']);
};


/**
 * Determine the correct layout to use for the given `value`.
 *
 * @param  {Object} `value` File object to test search for `layout`.
 * @return {String} The name of the layout to use.
 * @api private
 */

utils.pickContent = function (file) {
  if (isString(file)) {
    return file;
  }
  return utils.basePick(file, 'content');
};


/**
 * Look for the given `lookup` string in one the specified
 * `props` of `obj`.
 *
 * ```js
 * pickFrom(file, 'ext', ['b', 'd', 'c', 'e', 'd']);
 * ```
 *
 * @param  {Object} `object` The object to search.
 * @param  {String} `lookup` The value to find.
 * @param  {Array} `props` The nested properties to search on.
 * @return {*} Returns the first value found.
 */

utils.pickFrom = function (o, lookup, props) {
  if (o == null) {
    return null;
  }

  var isProps = Array.isArray(props);

  if (!isProps || props.length === 0) {
    if (o.hasOwnProperty(lookup)) {
      return o[lookup];
    }
    props = Object.keys(o);
  }

  var keys = slice(props).reverse();
  var len = keys.length - 1;
  var value;

  for (var i = len; i >= 0; i--) {
    var key = keys[i];
    var val = o[key];

    if (isObject(val) && val.hasOwnProperty(lookup)) {
      value = val[lookup];
      break;
    }
  }

  if (value) {
    return value;
  }
  return null;
};



/**
 * Determine the correct layout to use for the given `value`.
 *
 * @param  {Object} `value` File object to test search for `layout`.
 * @return {String} The name of the layout to use.
 * @api private
 */

utils.pickCached = function (file, locals, thisArg) {
  var val = null;

  if (!isString(arguments[0])) {
    return val;
  }

  var types = thisArg.viewType.renderable;
  var name = file;

  for (var i = 0; i < types.length; i++) {
    var cache = thisArg.cache[types[i]];
    if (cache.hasOwnProperty(name)) {
      val = cache[name];
      break;
    }
  }

  return val;
};


/**
 * Determine the correct layout to use for the given `value`.
 *
 * @param  {Object} `value` File object to test search for `layout`.
 * @return {String} The name of the layout to use.
 * @api private
 */

utils.pickEngine = function (cache, value) {
  if (!isObject(cache) || !isObject(value)) {
    return null;
  }

  var props = ['ext', 'engine', 'path'];
  var len = props.length;
  var ext;

  var maybe = pick(value, props);
  if (isEmpty(maybe)) {
    return null;
  }

  for (var i = 0; i < len; i++) {
    var ele = props[i];

    if (hasOwn(maybe, ele)) {
      if (ele === 'path') {
        ext = path.extname(maybe[ele]);
        break;
      } else {
        ext = maybe[ele];
        break;
      }
    }
  }

  if (ext) {
    return cache[ext];
  }

  return null;
};


/**
 * Determine the correct file extension to use, taking the following
 * into consideration, and in this order:
 *
 *   - `options.ext`
 *   - `value.data.ext`
 *   - `value.ext`
 *   - `value._opts.ext`
 *   - `path.extname(value.path)`
 *
 * The reasoning is that if an engine is explicitly defined, it should
 * take precendence over an engine that is automatically calculated
 * from `value.path`.
 *
 * @param  {String} `ext` The layout settings to use.
 * @param  {Object} `value` Template value object.
 * @param  {Object} `options` Object of options.
 * @return  {String} The extension to use.
 * @api private
 */

utils.pickExt = function(template, options, thisArg) {
  options = _.extend({}, options);
  var ext;

  if (isObject(template)) {
    template = _.extend({}, template);
    template.options = _.extend({}, template.options);

    if (ext = template.engine) {
      return template.ext;
    }

    if (ext = template.ext) {
      return ext;
    }

    if (ext = template.options.engine) {
      return ext;
    }

    if (ext = template.options.ext) {
      return ext;
    }

    if (ext = options.engine) {
      return ext;
    }

    if (ext = options.ext) {
      return ext;
    }
  }

  ext = thisArg.option('viewEngine');
  if (ext) {
    ext = utils.formatExt(ext);
  }

  return ext;
};


/**
 * Throw an error if `file` does not have `props`.
 *
 * @param  {String} `file` The object to test.
 * @api private
 */

utils.assertRootKeys = function(file, props) {
  return hasAny(file, ['content', 'path', 'locals']);
};


/**
 * Omit `locals` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.omitLocals = function(o) {
  return utils.baseOmit(o, 'locals');
};


/**
 * Omit the `options` property from the given
 * object.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.omitOptions = function(o) {
  return utils.baseOmit(o, ['options']);
};


/**
 * Omit root properties from the given
 * object.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.omitRoot = function(o) {
  return utils.baseOmit(o, rootKeys);
};


/**
 * Flatten nested `locals` objects.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.flattenLocals = function(obj) {
  var locals = utils.pickLocals(obj);
  var o = extend({}, locals, locals.locals);
  return utils.omitLocals(utils.omitRoot(o), 'locals');
};


/**
 * Flatten nested `options` objects.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

utils.flattenOptions = function(obj) {
  var options = utils.pickOptions(obj);
  var opts = extend({}, obj, options.options);
  return utils.omitOptions(utils.omitRoot(opts), 'options');
};



utils.pickFrom = function(value, key, arr) {
  var val = null;

  if (!isObject(value)) {
    return null;
  }

  if (hasOwn(value, key)) {
    return value[key];
  }

  var len = (arr && arr.length);
  if (len === 0) {
    return val;
  }

  for (var i = 0; i < len; ++i) {
    var prop = arr[i];

    if (hasOwn(value, prop)) {
      val = value[prop];
      if (hasOwn(val, key)) {
        return val[key];
      }
    }
  }
  return val;
};


/**
 * Generate a unique id to be used for caching unidentified
 * tempalates. (not used currently)
 *
 * @param  {Object} `options`
 * @return {Object}
 */

utils.generateId = function(options) {
  var opts = options || {};

  return opts.id ? opts.id : uniqueId({
    prefix: opts.prefix || '__id__',
    append: opts.append || ''
  });
};


/**
 * Ensure file extensions are formatted properly for lookups.
 *
 * @api private
 */

utils.setHeuristics = function(type, o, thisArg) {
  if (o == null) {
    return {};
  }

  var engines = thisArg.engines;

  var opts = o.options || {};
  var a = {};
  var b = {};

  a.ext = utils.formatExt(a.ext || opts.ext || path.extname(opts.path)) || null;
  a.type = type;
  a.engine = utils.formatExt(opts.engine || a.ext);
  a.engine = engines[a.engine || a.ext];
  a.renderable = opts.renderable;
  a.layout = opts.layout;
  a.normalized = true;

  b.__config = omitEmpty(a);
  return b;
};

/**
 * Return the index of the first value in the `array`
 * with the given native `type`.
 *
 * @param  {*} `type`
 * @param  {Number} `arr`
 * @return {Number} Index of the first value with a matching `type`.
 */

utils.firstIndexOfType = function firstIndexOfType(type, arr, idx) {
  var len = arr.length >>> 0;
  var val = null;

  for (var i = 0; i < len; i++) {
    if (idx && isNumber(idx)) {
      i = i + idx;
    }

    if (typeOf(arr[i]) === type) {
      val = i;
      break;
    }
  }
  return val;
};


/**
 * Return the first value in the `array` with the
 * given native `type`.
 *
 * @param  {*} `type`
 * @param  {Number} `arr`
 * @return {Number} Index of the first value with a matching `type`.
 */

utils.firstOfType = function firstOfType(type, arr, idx) {
  var len = arr.length >>> 0;
  var val = null;

  for (var i = 0; i < len; i++) {
    if (idx && isNumber(idx)) {
      i = i + idx;
    }

    if (typeOf(arr[i]) === type) {
      val = arr[i];
      break;
    }
  }
  return val;
};


/**
 * Return the first value in the `array` with the
 * given native `type`.
 *
 * @param  {*} `type`
 * @param  {Number} `arr`
 * @return {Number} Index of the first value with a matching `type`.
 */

utils.lastOfType = function lastOfType(type, arr) {
  var len = arr.length >>> 0;
  var last = arr[len - 1];
  var val = null;

  for (var i = 0; i < len; i++) {
    if (typeOf(last) === type) {
      val = last;
      break;
    }
  }
  return val;
};



function isNormalized(o) {
  return o && isObject(o) &&
    hasOwn(o, '__config');
}


utils.siftConfig = function(file, locals, thisArg) {
  var cache = thisArg.cache;

  var engine;
  var layout;
  var content = file;
  var options = {};
  var o = file;

  if (isNormalized(file)) {
    // file = _.reduce(file, function(acc, value, key) {
    //   file.engine =
    //   return acc;
    // }, {});
    engine = file.__config.engine;
    layout = file.__config.layout;
    locals = extend({}, file, locals);
    content = file.content;

  } else if (isObject(file)) {
    locals = extend({}, file, locals);
    content = file.content;
  }

  // console.log(file)
  o.engine = engine;
  o.layout = layout;
  o.content = content;
  o.locals = extend({}, options, locals);

  return _.transform(o, function(acc, val, key) {
    if (!isEmpty(val)) {
      acc[key] = val;
    }
  });
};


/**
 * Ensure file extensions are formatted properly for lookups.
 *
 * @api private
 */

utils.formatExt = function(ext) {
  if (ext && ext[0] !== '.') {
    ext = '.' + ext;
  }
  return ext;
};


/**
 * Format HTML using [js-beautify].
 *
 * @param  {String} `html` The HTML to beautify.
 * @param  {Object} `options` Options to pass to [js-beautify].
 * @return {String} Formatted string of HTML.
 */

utils.prettify = function(html, options) {
  return prettify(html, _.extend({
    indent_handlebars: true,
    indent_inner_html: true,
    preserve_newlines: false,
    max_preserve_newlines: 1,
    brace_style: 'expand',
    indent_char: ' ',
    indent_size: 2,
  }, options));
};


/**
 * Get the type of a value.
 *
 * @param  {*} `value`
 * @return {*}
 * @api private
 */

utils.typeOf = function (value) {
  return {}.toString.call(value).toLowerCase()
    .replace(/\[object ([\S]+)\]/, '$1');
};