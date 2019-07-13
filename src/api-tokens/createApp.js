const { ApiError } = require('../helpers/ApiError')
const { BAD_REQUEST } = require('http-status-codes')
const { validate } = require('../helpers/validate')

const createApp = ({ app, noId }) => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
    },
  }
  if (noId) {
    schema.required = schema.required.filter(item => item !== 'id')
    delete schema.properties.id
  }
  const { valid, error } = validate(app, schema)
  if (!valid) {
    throw new ApiError(BAD_REQUEST, error)
  }
  return app
}

module.exports = { createApp }
