'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const updateVersioningPlugin = require('../');

describe('Examples', function() {
  before(function*() {
    let connectOptions;

    if (/^5\./.test(mongoose.version)) {
      mongoose.set('useFindAndModify', false);
      connectOptions = {
        useNewUrlParser: true
      };
    }

    yield mongoose.connect('mongodb://127.0.0.1:27017/updateversioning', connectOptions);

    yield mongoose.connection.dropDatabase();
  });

  after(function*() {
    return mongoose.disconnect();
  });

  let Model;

  before(function*() {
    const schema = new mongoose.Schema({
      name: String,
      colors: [{ name: String }]
    });
    schema.plugin(updateVersioningPlugin);

    Model = mongoose.model('Toy_reuse', schema);

    let doc = yield Model.create({
      name: 'Turbo Man',
      colors: [{ name: 'red' }]
    });
    assert.equal(doc.__v, 0);
  });

  it('Increments version on updates', function*() {
    const schema = new mongoose.Schema({
      name: String,
      colors: [{ name: String }]
    });

    // Add this plugin
    schema.plugin(updateVersioningPlugin);

    const Model = mongoose.model('Toy', schema);

    // Create a doc that we'll update later. Starts with version 0...
    let doc = yield Model.create({
      name: 'Turbo Man',
      colors: [{ name: 'red' }]
    });
    assert.equal(doc.__v, 0);

    // This plugin will increment the document version
    doc = yield Model.findOneAndUpdate(
      {},
      { $push: { colors: { name: 'gold' } } },
      { new: true }
    );
    assert.equal(doc.__v, 1);
  });

  /**
   * [Mongoose versioning](https://mongoosejs.com/docs/guide.html#versionKey)
   * only triggers a version bump when you modify an array. That's because the
   * primary purpose of versioning is to protect you from, for example,
   * [overwriting the 3rd element in an array when someone deleted the 3rd element underneath you](http://aaronheckmann.blogspot.com/2012/06/mongoose-v3-part-1-versioning.html).
   * Updating just the `name` will **not** trigger a version bump.
   */

  it('Only increments when updating an array', function*() {
    let doc = yield Model.findOneAndUpdate({}, { name: 'Santa' }, { new: true });
    assert.equal(doc.__v, 0); // Did **not** bump the version
  });

  /**
   * The update versioning plugin will strip out any existing modifications
   * to the version key. If you want to explicitly overwrite the version key,
   * you should pass `version: false` to your [Mongoose query options](https://mongoosejs.com/docs/api.html#query_Query-setOptions).
   */

  it('Strips out version key overwrites', function*() {
    let doc = yield Model.findOneAndUpdate({}, { __v: 1225 }, { new: true });
    // The update versioning plugin prevented overwriting `__v`
    assert.equal(doc.__v, 0);

    doc = yield Model.findOneAndUpdate({}, { __v: 1225 }, {
      new: true,
      version: false // Skip update versioning for this one update
    });
    // Overwrote the version key
    assert.equal(doc.__v, 1225);
  });
});
