const { join } = require('path');
const { execute } = require('lambda-local');

exports.handler = async (body, context) => {
  return await execute({
    event: body,
    lambdaPath: join(__dirname, 'index.js'),
    lambdaHandler: "handler",
    timeoutMs: 5000,
  });
};
