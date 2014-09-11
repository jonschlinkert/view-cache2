/*!
 * view-cache <https://github.com/jonschlinkert/view-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash');
var util = require('util');
var path = require('path');
var chalk = require('chalk');
var Delimiters = require('delimiters');
var arrayify = require('arrayify-compact');
var prettify = require('js-beautify').html;
var loader = require('load-templates');
var Engines = require('engine-cache');
var Helpers = require('helper-cache');
var Parsers = require('parser-cache');
var Storage = require('config-cache');
var Layouts = require('layouts');
var extend = _.extend;
var merge = _.merge;


/**
 * Create a new instance of `Template`, optionally passing the default
 * `context` and `options` to use.
 *
 * **Example:**
 *
 * ```js
 * var Template = require('template');
 * var template = new Template();
 * ```
 *
 * @class `Template`
 * @param {Object} `context` Context object to start with.
 * @param {Object} `options` Options to use.
 * @api public
 */

function Template(options) {
  Delimiters.call(this, options);
  Storage.call(this, options);
  this.init();
}

util.inherits(Template, Storage);
extend(Template.prototype, Delimiters.prototype);


/**
 * Initialize defaults.
 *
 * @api private
 */

Template.prototype.init = function() {
  this.delims = {};
  this.engines = this.engines || {};
  this.parsers = this.parsers || {};

  this._ = {};
  this._.loader = loader(this.options);
  this._.parsers = new Parsers(this.parsers);
  this._.engines = new Engines(this.engines);
  this._.helpers = new Helpers({
    bindFunctions: true,
    thisArg: this
  });

  this.viewType = {};
  this.viewType.engine = {};
  this.viewType.delims = {};
  this.viewType.partial = [];
  this.viewType.renderable = [];
  this.viewType.layout = [];
  this.layoutSettings = {};

  this.defaultOptions();
  this.defaultConfig();
  this.defaultTemplates();
  this.defaultParsers();
  this.defaultEngines();
};


/**
 * Initialize default cache configuration.
 *
 * @api private
 */

Template.prototype.defaultConfig = function() {
  this.set('locals', {});
  this.set('imports', {});
  this.set('layouts', {});
  this.set('partials', {});
  this.set('pages', {});
};


/**
 * Initialize default options.
 *
 * @api private
 */

Template.prototype.defaultOptions = function() {
  this.option('cache', true);
  this.option('strictErrors', true);

  this.option('cwd', process.cwd());
  this.option('destExt', '.html');
  this.option('ext', '*');
  this.option('extensions', ['md', 'html', 'hbs']);

  this.option('layoutTag', 'body');
  this.option('layoutDelims', ['{%', '%}']);
  this.option('layout', null);

  this.option('partialLayout', null);
  this.option('mergePartials', true);
  this.option('mergeFunction', merge);
  this.option('bindHelpers', true);

  this.option('pretty', false);

  // loader options
  this.option('noparse', false);
  this.option('nonormalize', false);
  this.option('rename', function (filepath) {
    return path.basename(filepath);
  });

  // Delimiters
  this.option('delims', {});
  this.option('engineDelims', null);
  this.addDelims('*', ['<%', '%>']);
};


/**
 * Load default parsers
 *
 * @api private
 */

Template.prototype.defaultParsers = function() {
  var ext = this.option('extensions');
  this.parser(ext, require('parser-front-matter'));
  this.parser('*', require('parser-noop'));
};


/**
 * Load default engines.
 *
 *   - `*` The noop engine is used as a pass-through when no other engine matches.
 *   - `md` Used to process Lo-Dash templates in markdown files.
 *
 * @api private
 */

Template.prototype.defaultEngines = function() {
  var ext = this.option('extensions');
  this.engine(ext, require('engine-lodash'), {
    layoutDelims: ['{%', '%}'],
    destExt: '.html'
  });
  this.engine('*', require('engine-noop'), {
    layoutDelims: ['{%', '%}'],
    destExt: '.html'
  });
};


/**
 * Register default template types.
 *
 * @api private
 */

Template.prototype.defaultTemplates = function() {
  this.create('page', 'pages', {renderable: true});
  this.create('layout', 'layouts', {layout: true});
  this.create('partial', 'partials');
};


/**
 * Register default template types.
 *
 * @api private
 */

Template.prototype.defaultLoader = function() {

};
Template.prototype.load = function() {

};
Template.prototype.read = function() {

};
Template.prototype.renameKey = function() {

};
Template.prototype.rename = function() {

};


/**
 * Lazily add a `Layout` instance if it has not yet been added.
 * Also normalizes settings to pass to the `layouts` library.
 *
 * We can't instantiate `Layout` in the defaultConfig because
 * it reads settings which might not be set until after init.
 *
 * @api private
 */

Template.prototype.lazyLayouts = function(ext, options) {
  if (!this.layoutSettings.hasOwnProperty(ext)) {
    var opts = extend({}, this.options, options);

    this.layoutSettings[ext] = new Layouts({
      locals: opts.locals,
      layouts: opts.layouts,
      delims: opts.layoutDelims,
      tag: opts.layoutTag
    });
  }
};


/**
 * Determine the correct layout to use for the given `file`.
 *
 * @param  {Object} `file` File object to test search for `layout`.
 * @return {String} The name of the layout to use.
 * @api private
 */

Template.prototype.determineLayout = function (file) {
  if (file.layout) {
    return file.layout;
  }

  if (file.data && file.data.layout) {
    return file.data.layout;
  }

  if (file.locals && file.locals.layout) {
    return file.locals.layout;
  }

  return this.option('layout');
};


/**
 * Define a parser.
 *
 * Register the given parser callback `fn` as `ext`. If `ext`
 * is not given, the parser `fn` will be pushed into the
 * default parser stack.
 *
 * {%= docs("api-parser") %}
 *
 * @param {String} `ext`
 * @param {Function|Object} `fn` or `options`
 * @param {Function} `fn` Callback function.
 * @return {Object} `Template` to enable chaining.
 * @api public
 */

Template.prototype.parser = function (extensions, options, fn) {
  var args = [].slice.call(arguments, 1);

  arrayify(extensions).forEach(function (ext) {
    this._.parsers.register.apply(this, [ext].concat(args));
  }.bind(this));
  return this;
};


/**
 * Get the parser stack for the given `ext`.
 *
 * @param {String} `ext` The parser stack to get.
 * @return {Object} `Template` to enable chaining.
 * @api public
 */

Template.prototype.getParsers = function (ext) {
  return this._.parsers.get.apply(this, arguments);
};


/**
 * Run a stack of async parsers.
 *
 * Run a `stack` of parsers against the given `file`. If `file` is
 * an object with a `path` property, then the `extname` is used to
 * get the parser stack. If a stack isn't found on the cache the
 * default `noop` parser will be used.
 *
 * @doc api-parse
 * @param  {Object|String} `file` Either a string or an object.
 * @param  {Array} `stack` Optionally pass an array of functions to use as parsers.
 * @param  {Object} `options`
 * @return {Object} Normalize `file` object.
 * @api public
 */

Template.prototype.parse = function (file, stack, options) {
  return this._parse('parse', file, stack, options);
};


/**
 * Run a stack of sync parsers.
 *
 * Run a `stack` of sync parsers against the given `file`. If `file` is
 * an object with a `path` property, then the `extname` is used to
 * get the parser stack. If a stack isn't found on the cache the
 * default `noop` parser will be used.
 *
 * @doc api-parseSync
 * @param  {Object|String} `file` Either a string or an object.
 * @param  {Array} `stack` Optionally pass an array of functions to use as parsers.
 * @param  {Object} `options`
 * @return {Object} Normalize `file` object.
 * @api public
 */

Template.prototype.parseSync = function (file, stack, options) {
  return this._parse('parseSync', file, stack, options);
};


/**
 * Private method for normalizing args passed to parsers.
 *
 * @param  {Object|String} `file` Either a string or an object.
 * @param  {Array} `stack` Optionally pass an array of functions to use as parsers.
 * @param  {Object} `options`
 * @return {Object} Normalize `file` object.
 * @api private
 */

Template.prototype._parse = function (method, file, stack, options) {
  var ext;
  if (typeof file === 'object') {
    var o = merge({}, options, file);
    ext = o.ext;
  }
  if (!Array.isArray(stack)) {
    options = stack;
    stack = null;
  }
  if (ext) {
    stack = this.getParsers(ext);
  }
  if (!stack) {
    stack = this.getParsers('*');
  }
  return this._.parsers[method](file, stack, options);
};


/**
 * Register the given view engine callback `fn` as `ext`. If only `ext`
 * is passed, the engine registered for `ext` is returned. If no `ext`
 * is passed, the entire cache is returned.
 *
 * @doc api-engine
 * @param {String} `ext`
 * @param {Function|Object} `fn` or `options`
 * @param {Object} `options`
 * @return {Object} `Template` to enable chaining
 * @api public
 */

Template.prototype.engine = function (extension, fn, options) {
  var args = [].slice.call(arguments);
  if (typeof extension === 'string' && args.length <= 1) {
    return this._.engines.get(extension);
  }
  arrayify(extension).forEach(function (ext) {
    this._registerEngine(ext, fn, options);
  }.bind(this));
  return this;
};


/**
 * Get the engine registered for the given `ext`. If no
 * `ext` is passed, the entire cache is returned.
 *
 * @doc api-getEngine
 * @param {String} `ext` The engine to get.
 * @return {Object} Object of methods for the specified engine.
 * @api public
 */

Template.prototype.getEngine = function (ext) {
  return this._.engines.get(ext);
};


/**
 * Register or get helpers for the given `ext` (engine).
 *
 * @param {String} `ext` The engine to register helpers with.
 * @return {Object} Object of helpers for the specified engine.
 * @api public
 */

Template.prototype.helpers = function (ext) {
  var engine = this.getEngine(ext);
  return engine.helpers;
};


/**
 * Private method for registering an engine.
 *
 * @param {String} `ext`
 * @param {Function|Object} `fn` or `options`
 * @param {Object} `options`
 * @return {Object} `Template` to enable chaining
 * @api private
 */

Template.prototype._registerEngine = function (ext, fn, options) {
  var opts = extend({thisArg: this, bindFunctions: true}, options);
  this._.engines.register(ext, fn, opts);

  if (ext[0] !== '.') {
    ext = '.' + ext;
  }
  if (opts.delims) {
    this.option('engineDelims', this.makeDelims(opts.delims));
  }

  // Initialize layouts
  this.lazyLayouts(ext, opts);
  return this;
};


/**
 * Get and set _generic_ helpers on the `cache`. Helpers registered
 * using this method will be passed to every engine, so be sure to use
 * generic javascript functions - unless you want to see Lo-Dash
 * blow up from `Handlebars.SafeString`.
 *
 * @param {String} `name` The helper to cache or get.
 * @param {Function} `fn` The helper function.
 * @param {Object} `thisArg` Context to bind to the helper.
 * @return {Object} Object of helpers for the specified engine.
 * @api public
 */

Template.prototype.addHelper = function (name, fn, thisArg) {
  return this._.helpers.addHelper(name, fn, thisArg);
};


/**
 * Get and set _generic_ async helpers on the `cache`. Helpers registered
 * using this method will be passed to every engine. As with the sync
 * version of this method, be sure to use generic javascript functions.
 *
 * @param {String} `name` The helper to cache or get.
 * @param {Function} `fn` The helper function.
 * @param {Object} `thisArg` Context to bind to the helper.
 * @return {Object} Object of helpers for the specified engine.
 * @api public
 */

Template.prototype.addHelperAsync = function (name, fn, thisArg) {
  return this._.helpers.addHelperAsync(name, fn, thisArg);
};


/**
 * Automatically adds an async helper for each template type.
 *
 * @param {String} `type` The type of template.
 * @param {String} `plural` Plural form of `type`.
 * @api private
 */

Template.prototype._addHelperAsync = function (type, plural, addHelper) {
  this.addHelperAsync(type, function (name, locals, next) {
    var last = _.last(arguments);

    if (typeof locals === 'function') {
      next = locals;
      locals = {};
    }
    if (typeof next !== 'function') {
      next = last;
    }

    var partial = this.cache[plural][name];
    if (!partial) {
      console.log(new Error(chalk.red('helper {{' + type + ' "' + name + '"}} not found.')));
      next(null, '');
      return;
    }

    partial.locals = merge({}, partial.locals, locals);
    this.render(partial, {}, function (err, content) {
      if (err) {
        next(err);
        return;
      }
      next(null, content);
      return;
    });
  }.bind(this));
};


/**
 * Keeps track of custom view types, so we can pass them properly to
 * registered engines.
 *
 * @param {String} `plural`
 * @param {Object} `opts`
 * @api private
 */

Template.prototype._setViewType = function (plural, opts) {
  var type = this.viewType;

  if (opts.renderable) {
    type.renderable.push(plural);
  } else if (opts.layout) {
    type.layout.push(plural);
  } else {
    type.partial.push(plural);
  }
};


/**
 * Add a new template `type`, along with associated get/set methods.
 * You must specify both the singular and plural names for the type.
 *
 * @param {String} `type` Singular name of the type to create, e.g. `page`.
 * @param {String} `plural` Plural name of the template type, e.g. `pages`.
 * @param {Object} `options` Options for the template type.
 *   @option {Boolean} [options] `renderable` Is the template a partial view?
 *   @option {Boolean} [options] `layout` Can the template be used as a layout?
 *   @option {Boolean} [options] `partial` Can the template be used as a partial?
 * @return {Object} `Template` to enable chaining.
 * @api public
 */

Template.prototype.create = function(type, plural, options) {
  if (typeof plural !== 'string') {
    throw new Error('A plural form must be defined for: "' + type + '".');
  }

  var opts = extend({}, options);
  this.cache[plural] = this.cache[plural] = {};

  if (opts.delims) {
    this.viewType.delims[type] = this.makeDelims(opts.delims);
  }

  if (opts.engine) {
    this.viewType.engine[type] = opts.engine;
  }

  // Add a `viewType` to the cache for `plural`
  this._setViewType(plural, opts);

  Template.prototype[type] = function (key, value, locals, options) {
    var args = [].slice.call(arguments);

    return this;
  };

  Template.prototype[plural] = function (pattern, locals, options) {
    var args = [].slice.call(arguments);

    return this;
  };

  // Create helpers to handle each template type we create.
  if (!this._.helpers.hasOwnProperty(type)) {
    this._addHelperAsync(type, plural);
  }
  return this;
};


/**
 * Normalize and extend custom view types onto the cache.
 *
 * @param {String} `plural` Object to extend
 * @param {Object} `files` File objects to normalize
 * @param {Object} `locals` Local data to extend onto the `file.data` property.
 * @param {Object} `options` Options to pass to
 * @api private
 */

Template.prototype.normalize = function (type, plural, files, locals, options) {
  var opts = extend({}, options);

  _.forOwn(files, function (value, key, locals) {
    var ext = path.extname(value.path) || opts.ext || this.option('ext');
    if (ext && ext[0] !== '.') {
      ext = '.' + ext;
    }

    // var stack = this.getParsers(ext);
    // var value = this.parseSync(root, stack, root.data);

    // value._opts = extend({}, opts);
    // value._opts.viewType = type;

    this.cache[plural][key] = value;

    if (opts.layout) {
      this.layoutSettings[ext].setLayout(this.cache[plural]);
    }
  }.bind(this));
};


/**
 * Get partials from the cache. If `options.mergePartials` is `true`,
 * this object will keep custom partial types seperate - otherwise,
 * all templates with the type `partials` will be merged onto the
 * same object. This is useful when necessary for the engine being
 * used.
 *
 * @param  {Object} `options` Options to pass to registered view engines.
 * @return {String}
 * @api private
 */

Template.prototype._mergePartials = function (options, shouldMerge) {
  shouldMerge = shouldMerge || this.option('mergePartials');
  var opts = extend({partials: {}}, options);

  this.cache.partials  = extend({}, this.cache.partials, opts.partials);

  this.viewType.partial.forEach(function (type) {
    var partials = merge({}, this.cache[type]);
    _.forOwn(partials, function (value, key) {
      if (shouldMerge) {
        opts.partials[key] = value.content;
      } else {
        opts[type][key] = value.content;
      }
      opts = merge({}, opts, value.data, value.locals);
    });
  }.bind(this));
  return opts;
};


/**
 * Render `str` with the given `options` and `callback`.
 *
 * @param  {Object|String} `file` String or normalized template object.
 * @param  {Object} `options` Options to pass to registered view engines.
 * @return {String}
 * @api public
 */

Template.prototype.render = function (file, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  // If `file` is a string, look it up on the cache.
  if (typeof file === 'string') {
    file = this.lookupTemplate(file, 'renderable', options);
  }

  // Ensure the correct properties are on the `file` object.
  this.assertProperties(file);

  // Build up the context to pass to the engine.
  var opts = this.buildContext(file, options);

  // Get the correct file extenion to use
  var ext = this.resolveExtension(file, opts);

  // If defined, wrap the file with a layout.
  var content = this.applyLayout(ext, file);

  // Extend generic helpers into engine-specific helpers.
  opts.helpers = merge({}, this._.helpers, opts.helpers);
  opts = this._mergePartials(opts);
  merge(opts, this.lookupDelims(ext, file));


  var engine = this.lookupEngine(ext, opts);

  try {
    engine.render(content, opts, function (err, content) {
      var opt = extend({}, this.options, opts);
      if (opt.pretty) {
        content = this.prettify(content, opt.pretty);
      }
      return this._.helpers.resolve(content, cb.bind(this));
    }.bind(this));
  } catch (err) {
    cb(err);
  }
};


/**
 * Determine the correct file extension to use, taking the following
 * into consideration, and in this order:
 *
 *   - `options.ext`
 *   - `file.data.ext`
 *   - `file.ext`
 *   - `file._opts.ext`
 *   - `path.extname(file.path)`
 *
 * The reasoning is that if an engine is explicitly defined, it should
 * take precendence over an engine that is automatically calculated
 * from `file.path`.
 *
 * @param  {String} `ext` The layout settings to use.
 * @param  {Object} `file` Template file object.
 * @param  {Object} `options` Object of options.
 * @return  {String} The extension to use.
 * @api private
 */

Template.prototype.resolveExtension = function(file, options) {
  var opts = extend({}, file._opts, file, file.data, options);
  opts = _.omit(opts, ['_opts', 'stat', 'data']);

  // Get file extension
  var ext = opts.ext || path.extname(file.path) || '*';
  if (ext[0] !== '.') {
    ext = '.' + ext;
  }
  return ext;
};


/**
 * If a layout is defined, apply it. Otherwise just return the content as-is.
 *
 * @param  {String} `ext` The layout settings to use.
 * @param  {Object} `file` Template object, with `content` property.
 * @return  {String} Either the string wrapped with a layout, or the original string if no layout was defined.
 * @api private
 */

Template.prototype.applyLayout = function(ext, file) {
  var layoutEngine = this.layoutSettings[ext];
  var str = file.content;

  if (!!layoutEngine) {
    var layout = this.determineLayout(file);
    var obj = layoutEngine.render(str, layout);
    return obj.content;
  }
  return str;
};


/**
 * Lookup a cached template. If the template isn't cached, or at least isn't found,
 * since it's a string we assume it should be rendered. If caching is enabled,
 * the string, locals and data will be normalized before rendering the string.
 *
 * To disable caching of raw strings, just set `options.cache` to false, or defined
 * `template.option('cache', false)`.
 *
 * @param  {String} `key` Name of the template.
 * @param  {String} `type` Template type. Valid values are `renderable`|`partial`|`layout`.
 * @param  {Object} `options` Options or locals.
 * @return  {Object} Normalized template object.
 * @api private
 */

Template.prototype.lookupTemplate = function (key, type, options) {
  var opts = extend({}, options);
  var str = key,
    id;

  type = type || 'renderable';

  // If caching is enabled, lookup the template
  if (this.option('cache')) {
    var len = this.viewType[type].length;
    var cached;

    for (var i = 0; i < len; i++) {
      var plural = this.viewType[type][i];
      cached = this.cache[plural][key];
      if (cached) {
        break;
      }
      cached = _.find(this.cache[plural], {
        path: key
      });
    }

    if (cached) {
      cached._opts = extend({}, cached._opts, options);
      return cached;
    }

    // if it's not found, cache and normalize it before returning it
    id = _.uniqueId('__temp__') + '.html';
    this.page(id, {path: id, content: str}, options);
    key = this.cache.pages[id];
  } else {
    id = _.uniqueId('__temp__') + '.html';
    key = {path: id, content: str, data: options};
  }
  return key;
};


/**
 * If the current engine has custom delimiters defined,
 * pass them to the engine
 *
 * @param  {String} `ext` Delimiters to lookup.
 * @param  {String} `options` Check to see if `engine` is defined on the options.
 * @return  {Object} The delimiters to use.
 * @api private
 */

Template.prototype.lookupDelims = function(ext, file) {
  if (ext[0] !== '.') {
    ext = '.' + ext;
  }

  var opts = extend({}, file._opts);
  var delims;

  if (opts.viewType) {
    delims = this.viewType.delims[opts.viewType];
  }

  if (!delims) {
    delims = this.getDelims(ext);
  }

  if (!delims) {
    delims = this.option('engineDelims');
  }

  this.useDelims(ext);
  return delims;
};


/**
 * Get the template engine for the given `ext`. Alternatively,
 * an engine may be defined in any of the following ways:
 *
 *   - `options.engine` Defined on the options for an engine or template.
 *
 * @param  {String} `ext` Engine to lookup.
 * @param  {String} `options` Check to see if `engine` is defined on the options.
 * @return  {Object} The engine to use.
 * @api private
 */

Template.prototype.lookupEngine = function(ext, opts) {
  if (opts.ext) {
    return this.getEngine(opts.ext);
  } else if (opts.engine) {
    return this.getEngine(opts.engine);
  } else {
    return this.getEngine(ext);
  }
};


/**
 * Build up the context with the given objects. To change how
 * context is merged, use `options.contextFn`.
 *
 * @param  {Object} `file` Normalized file object.
 * @param  {Object} `methodLocals` Locals defined on the `.render()` method.
 * @return  {Object} Merged context object.
 * @api private
 */

Template.prototype.buildContext = function(file, locals) {
  if (this.option('contextFn')) {
    return this.option('contextFn').call(this, file, locals);
  }

  var fileRoot = _.omit(file, ['data', 'orig', 'locals']);

  var context = {};
  merge(context, this.cache.data);
  merge(context, locals);
  merge(context, fileRoot);
  merge(context, file.data, file.locals);

  context = _.omit(context, ['_opts']);
  return context;
};


/**
 * Throw an error if `file` does not have `keys`.
 *
 * @param  {String} `file` The object to test.
 * @api private
 */

Template.prototype.assertProperties = function(file, props) {
  props = props || ['content', 'path'];

  if (typeof file === 'object' && !file.hasOwnProperty('content')) {
    throw new Error('render() expects "' + file + '" to be an object.');
  }
};


/**
 * Format HTML using [js-beautify].
 *
 * @param  {String} `html` The HTML to beautify.
 * @param  {Object} `options` Options to pass to [js-beautify].
 * @return {String} Formatted string of HTML.
 */

Template.prototype.prettify = function(html, options) {
  return prettify(html, extend({
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

function typeOf(value) {
  return {}.toString.call(value).toLowerCase()
    .replace(/\[object ([\S]+)\]/, '$1');
}


/**
 * Expose `Template`
 */

module.exports = Template;

