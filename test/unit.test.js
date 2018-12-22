'use strict';

const Schema = require('mongoose').Schema;
const assert = require('assert');
const applyVersioning = require('../lib/applyVersioning');

describe('applyVersioning', function() {
  let schema;

  before(function() {
    schema = new Schema({
      name: String,
      tags: [String],
      colors: [{ hex: String }]
    });
  });

  it('no-op if `version` option is false', function() {
    let update = { $push: { tags: 'foo' } };
    assert.ok(!applyVersioning(update, { version: false }, schema));

    assert.deepEqual(update, { $push: { tags: 'foo' } });
  });

  it('incs on $push', function() {
    let update = { $push: { tags: 'foo' } };
    assert.ok(applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { $push: { tags: 'foo' }, $inc: { __v: 1 } });
  });

  it('incs on $set', function() {
    let update = { $set: { tags: ['foo'] } };
    assert.ok(applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { $set: { tags: ['foo'] }, $inc: { __v: 1 } });
  });

  it('removes $set on versionKey', function() {
    let update = { $set: { tags: ['foo'], __v: 42 } };
    assert.ok(applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { $set: { tags: ['foo'] }, $inc: { __v: 1 } });
  });

  it('incs on implicit $set', function() {
    let update = { tags: ['foo'] };
    assert.ok(applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { tags: ['foo'], $inc: { __v: 1 } });
  });

  it('no-op if no array updated', function() {
    let update = { name: 'foo' };
    assert.ok(!applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { name: 'foo' });
  });

  it('deletes top-level version key overwrite', function() {
    let update = { name: 'foo', __v: 42 };
    assert.ok(!applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, { name: 'foo' });
  });

  it('adds if pull on doc array', function() {
    let update = { $pull: { colors: { hex: 'ffd700' } } };
    assert.ok(applyVersioning(update, { version: true }, schema));

    assert.deepEqual(update, {
      $pull: { colors: { hex: 'ffd700' } },
      $inc: { __v: 1 }
    });
  });

  it('sets to 0 if overwrite', function() {
    let update = { name: 'foo' };
    assert.ok(applyVersioning(update, { version: true, overwrite: true }, schema));

    assert.deepEqual(update, { name: 'foo', __v: 0 });
  });
});
