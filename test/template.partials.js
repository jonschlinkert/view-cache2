/*!
 * template <https://github.com/jonschlinkert/template>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors
 * Licensed under the MIT License (MIT)
 */

'use strict';

var assert = require('assert');
var should = require('should');
var Template = require('..');
var _ = require('lodash');


describe('template partial', function () {
  describe('.partial() strings', function () {
    it('should add partials to the cache.', function () {
      var template = new Template();
      template.partials('a.md', 'b');
      template.cache.partials.should.have.property('a.md');
    });

    it('should `.get()` partials from the cache.', function () {
      var template = new Template();
      template.partials('a.md', 'b');
      // must be escaped for [getobject]
      template.get('partials.a\\.md').content.should.equal('b');
    });

    it('should add the template string to the `content` property.', function () {
      var template = new Template();
      template.partials('a.md', 'this is content.');
      template.cache.partials['a.md'].content.should.equal('this is content.');
    });

    it('should add locals to the `locals` property.', function () {
      var template = new Template();
      template.partials('a.md', 'b', {c: 'c'});
      template.cache.partials['a.md'].locals.should.have.property('c');
    });

    it('should add locals to the `locals` property.', function () {
      var template = new Template();
      template.partials('a.md', 'b', {c: 'c'});
      template.cache.partials['a.md'].locals.should.have.property('c');
    });

    it('should add the third arg to the `locals` property.', function () {
      var template = new Template();
      template.partials('a.md', 'b', {title: 'c'});
      template.cache.partials['a.md'].locals.should.have.property('title');
    });
  });

  describe('.partials() objects', function () {
    it('should add partials to the cache.', function () {
      var template = new Template();
      template.partials({'a.md': {content: 'b', data: {c: 'c'}}});
      template.cache.partials.should.have.property('a.md');
    });

    it('should add the template string to the `content` property.', function () {
      var template = new Template();
      template.partials({'a.md': {content: 'b', data: {c: 'c'}}});
      template.cache.partials['a.md'].content.should.equal('b');
    });

    it('should add locals to the `data` property.', function () {
      var template = new Template();
      template.partials({'a.md': {content: 'b', data: {c: 'c'}}});
      template.cache.partials['a.md'].data.should.have.property('c');
    });

    it('should add locals to the `data` property.', function () {
      var template = new Template();
      template.partials({'a.md': {content: 'b', data: {c: 'c'}}});
      template.cache.partials['a.md'].data.should.have.property('c');
    });
  });

  describe('when a partial has front matter', function () {
    it('should parse the partial.', function () {
      var template = new Template();
      template.partials('a.md', '---\nname: AAA\n---\nThis is content.');
      template.cache.partials.should.have.property('a.md');
      template.cache.partials['a.md'].should.have.property('content', 'This is content.');
    });

    it('should parse the `content` value.', function () {
      var template = new Template();
      template.partials({'a.md': {path: 'a.md', content: '---\nname: AAA\n---\nThis is content.'}});
      template.cache.partials.should.have.property('a.md');
    });

    it('should merge locals and front-matter data.', function () {
      var template = new Template();
      template.partials({'a.md': {content: '---\nname: AAA\n---\nThis is content.', data: {c: 'c'}}});
      template.cache.partials.should.have.property('a.md');
      template.cache.partials['a.md'].should.have.property('data', { c: 'c', name: 'AAA' });
    });

    it('should save both locals and front-matter data to the `file` object.', function () {
      var template = new Template();
      template.partials({'a.md': {content: '---\nname: AAA\n---\nThis is content.', name: 'BBB'}});
      template.cache.partials.should.have.property('a.md');
      template.cache.partials['a.md'].should.have.property('data', { name: 'AAA' });
      template.cache.partials['a.md'].should.have.property('locals', { name: 'BBB' });
    });

    it('should use the key as `file.path` if one does not exist.', function () {
      var template = new Template();
      template.partials({'a.md': {content: '---\nname: AAA\n---\nThis is content.', data: {c: 'c'}}});
      template.cache.partials.should.have.property('a.md');
      template.cache.partials['a.md'].path.should.equal('a.md');
    });
  });

  // describe('context', function () {
  //   it.only('should prefer helper locals over method locals.', function () {
  //     var template = new Template();
  //     template.partials('alert.md', '---\nlayout: href\ntitle: partial yfm data\n---\n<%= title %>.', {title: 'partial locals'});
  //     template.page('home.md', '---\ntitle: Baz\nlayout: page yfm data\n---\n<%= title %>.\n<%= partial("alert.md", {title: "helper locals"}) %>', {title: 'page locals'});

  //     template.renderSync('home.md', {title: 'render locals'}).should.equal('foo');
  //   });

  //   // it('should prefer helper locals over method locals.', function () {
  //   //   var template = new Template();
  //   //   template.partials('alert.md', '---\nlayout: href\ntitle: Foo\n---\nThis is <%= title %>.');
  //   //   template.page('home.md', '---\ntitle: Baz\nlayout: default\n---\nThis is <%= title %>.\n<%= partial("alert.md", {title: "Fez"}) %>');

  //   //   console.log(template.getPartial('link.md'));
  //   //   var content = template.renderSync('home.md');
  //   //   console.log('content:', content);

  //   //   // template.cache.partials.should.have.property('a.md');
  //   //   // template.cache.partials['a.md'].should.have.property('content', 'This is content.');
  //   // });
  // });

  describe('when a partial has a layout defined:', function () {
    it('should parse the partial sync.', function () {
      var template = new Template();
      template.layout('default.md', 'bbb{% body %}bbb');
      template.layout('href.md', '<a href="{% body %}"><%= text %></a>');
      template.partials('link.md', '---\nlayout: href.md\ntext: Jon Schlinkert\n---\nhttps://github.com/jonschlinkert', {a: 'b'});
      template.page('home.md', '---\nname: Home Page\nlayout: default.md\n---\nThis is home page content.\n<%= partial("link.md", {c: "d"}) %>');

      var content = template.renderSync('home.md');
      content.should.equal('bbbThis is home page content.\n<a href="https://github.com/jonschlinkert">Jon Schlinkert</a>bbb');
    });

    it('should parse the partial.', function (done) {
      var template = new Template();
      template.layout('default.md', 'bbb{% body %}bbb');
      template.layout('href.md', '<a href="{% body %}"><%= text %></a>');
      template.partials('link.md', '---\nlayout: href.md\ntext: Jon Schlinkert\n---\nhttps://github.com/jonschlinkert', {a: 'b'});
      template.page('home.md', '---\nname: Home Page\nlayout: default.md\n---\nThis is home page content.\n<%= partial("link.md", {c: "d"}) %>');

      template.render('home.md', function (err, content) {
        if (err) return done(err);
        content.should.equal('bbbThis is home page content.\n<a href="https://github.com/jonschlinkert">Jon Schlinkert</a>bbb');
        done();
      });
    });

  });

});