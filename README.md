# view-cache-2 [![NPM version](https://badge.fury.io/js/view-cache-2.svg)](http://badge.fury.io/js/view-cache-2)


> Templates.

## Install
#### Install with [npm](npmjs.org):

```bash
npm i view-cache-2 --save-dev
```

## Usage

```js
var Views = require('view-cache-2');
var views = new Views();
```

## API
### [Template](index.js#L40)

Create a new instance of `Template`, optionally passing the default `context` and `options` to use.

* `context` **{Object}**: Context object to start with.    
* `options` **{Object}**: Options to use.    

**Example:**

```js
var Template = require('template');
var template = new Template();
```

### [.parser](index.js#L206)

Register the given parser callback `fn` as `ext`. If `ext` is not given, the parser `fn` will be pushed into the default parser stack.

* `ext` **{String}**    
* `fn` **{Function|Object}**: or `options`    
* `returns` **{Object}** `Template`: to enable chaining.  

```js
// Default stack
template.parser(require('parser-front-matter'));

// Associated with `.hbs` file extension
template.parser('hbs', require('parser-front-matter'));
```

See [parser-cache] for the full range of options and documentation.


### [.getParsers](index.js#L293)

* `ext` **{String}**: The parser stack to get.    
* `returns` **{Object}** `Template`: to enable chaining.  

Get a cached parser stack for the given `ext`.

### [.engine](index.js#L312)

Register the given view engine callback `fn` as `ext`. If only `ext` is passed, the engine registered for `ext` is returned. If no `ext` is passed, the entire cache is returned.

* `ext` **{String}**    
* `fn` **{Function|Object}**: or `options`    
* `options` **{Object}**    
* `returns` **{Object}** `Template`: to enable chaining  


```js
var consolidate = require('consolidate')
template.engine('hbs', consolidate.handlebars);
template.engines('hbs');
// => {render: [function], renderFile: [function]}
```

See [engine-cache] for details and documentation.

### [.getEngine](index.js#L335)

Get the engine registered for the given `ext`. If no `ext` is passed, the entire cache is returned.

* `ext` **{String}**: The engine to get.    
* `returns` **{Object}**: Object of methods for the specified engine.  

```js
var consolidate = require('consolidate')
template.engine('hbs', consolidate.handlebars);
template.getEngine('hbs');
// => {render: [function], renderFile: [function]}
```

### [.helpers](index.js#L349)

* `ext` **{String}**: The helper cache to get and set to.    
* `returns` **{Object}**: Object of helpers for the specified engine.  

Get and set helpers for the given `ext` (engine). If no
`ext` is passed, the entire helper cache is returned.

### [.addHelper](index.js#L366)

* `name` **{String}**: The helper to cache or get.    
* `fn` **{Function}**: The helper function.    
* `thisArg` **{Object}**: Context to bind to the helper.    
* `returns` **{Object}**: Object of helpers for the specified engine.  

Get and set helpers on `templates.cache.helpers.` Helpers registered
using this method should be generic javascript functions, since they
will be passed to every engine.

### [.create](index.js#L384)

* `type` **{String}**: Singular name of the type to create, e.g. `page`.    
* `plural` **{String}**: Plural name of the template type, e.g. `pages`.    
* `options` **{Object}**: Options for the template type.  
    - `isRenderable` **{Boolean}**: Is the template a partial view?
    - `isLayout` **{Boolean}**: Can the template be used as a layout?
      
* `returns` **{Object}** `Template`: to enable chaining.  

Add a new template `type`, along with associated get/set methods.
You must specify both the singular and plural names for the type.

### [.render](index.js#L447)

* `options` **{Object}**: Options to pass to registered view engines.    
* `returns`: {String}  

Render `str` with the given `options` and `callback`.

## Related

* [engine-cache]
* [engine-noop]
* [parse-files]
* [parser-cache]
* [parser-front-matter]
* [parser-noop]

## Author

**Jon Schlinkert**
 
+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert) 

## License
Copyright (c) 2014 Jon Schlinkert, contributors.  
Released under the MIT license

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on August 31, 2014._


[engine-cache]: https://github.com/jonschlinkert/engine-cache
[engine-noop]: https://github.com/jonschlinkert/engine-noop
[parse-files]: https://github.com/jonschlinkert/parse-files
[parser-cache]: https://github.com/jonschlinkert/parser-cache
[parser-front-matter]: https://github.com/jonschlinkert/parser-front-matter
[parser-noop]: https://github.com/jonschlinkert/parser-noop