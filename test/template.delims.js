/*!
 * view-cache <https://github.com/jonschlinkert/view-cache>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors
 * Licensed under the MIT License (MIT)
 */

'use strict';

var fs = require('fs');
var path = require('path');
var should = require('should');
var Template = require('..');
var template = new Template();


describe('template delimiters:', function () {
  it('should use custom delimiters defined on a template type:', function (done) {
    var template = new Template();
    template.engine('*', require('engine-lodash'));
    template.create('doc', 'docs', {renderable: true, delims: ['<<', '>>']})

    template.doc('foo', {content: '<<= name >>', name: 'Jon Schlinkert'});
    template.docs('bar', {content: '<<= name >>', name: 'Brian Woodward'});

    template.render('foo', function (err, content) {
      if (err) console.log(err);
      content.should.equal('Jon Schlinkert');
    });

    template.render('bar', function (err, content) {
      if (err) console.log(err);
      content.should.equal('Brian Woodward');
    });
    done();
  });

  it('should use custom delimiters defined on an actual template:', function (done) {
    var template = new Template();
    template.engine('*', require('engine-lodash'));
    template.create('doc', 'docs', {renderable: true})

    template.doc('foo', {content: '<<= name >>{{= name }}', name: 'Jon Schlinkert'}, {
      delims: ['<<', '>>']
    });
    template.doc('bar', {content: '<<= name >>{{= name }}', name: 'Brian Woodward'}, {
      delims: ['{{', '}}']
    });

    template.render('foo', function (err, content) {
      if (err) console.log(err);
      content.should.equal('Jon Schlinkert{{= name }}');
    });

    template.render('bar', function (err, content) {
      if (err) console.log(err);
      content.should.equal('<<= name >>Brian Woodward');
    });
    done();
  });
});