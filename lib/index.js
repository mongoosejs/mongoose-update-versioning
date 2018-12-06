const applyVersioning = require('./applyVersioning');

module.exports = function updateVersioningPlugin(schema) {
  schema.pre('findOneAndUpdate', createMiddleware());
  schema.pre('replaceOne', createMiddleware(true));
  schema.pre('update', createMiddleware());
  schema.pre('updateOne', createMiddleware());
  schema.pre('updateMany', createMiddleware());

  return schema;
};

function createMiddleware(forceOverwrite) {
  return function updateVersioningMiddleware() {
    const options = Object.assign({}, this.options);
    if (forceOverwrite) {
      options.overwrite = true;
    }
    applyVersioning(this.getUpdate(), options, this.model.schema);
  };
}
