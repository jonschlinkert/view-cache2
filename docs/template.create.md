```js
template.post(key, value, options);
```

Template objects are always normalized to the following:

```js
{
  path: 'home.md',
  content: 'ABC',
  data: {foo: 'bar'},
  locals: {foo: 'baz'},
  orig: '---\nfoo: bar\n---\nABC'
}
```

### Options

  - `delims`
  - `engine`

**Functions**:

  - `loader`
  - `rename`
  - `normalize`
  - `context`


**Example:**:

```js
template.post('home', '---\nfoo: bar\n---\nABC', {
  loader: function(key, value) {

  },
  renameFn: function(key, value) {

  },
  normalize: function(key, value) {

  },
  context: function (global, data, locals) {
    return _.defaults
  },
  engine: 'jade'
});
```
