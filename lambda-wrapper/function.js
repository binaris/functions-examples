const { join } = require('path');
const { execute } = require('lambda-local');

function makeAPIGatewayEvent(body, context) {
  const isBase64Encoded = (!body || body === {}) ? true : false;
  return {
    path: context.request.path,
    httpMethod: context.request.method,
    headers: context.request.headers,
    multiValueHeaders: context.request.headers,
    queryStringParameters: context.request.query,
    multiValueQueryStringParameters: context.request.query,
    pathParmeters: context.request.path,
    isBase64Encoded,
    body: isBase64Encoded ? context.request.body : body,
  };
}

/**
 * @type { import("./binaris").BinarisFunction }
 */
exports.vanillaLambda = async (body) => {
  return await execute({
    event: body,
    lambdaPath: join(__dirname, 'handler.js'),
    lambdaHandler: 'vanillaLambda',
    timeoutMs: 5000,
  });
};

/**
 * @type { import("./binaris").BinarisFunction }
 */
exports.gatewayLambda = async (body, context) => {
  return await execute({
    event: makeAPIGatewayEvent(body, context),
    lambdaPath: join(__dirname, 'handler.js'),
    lambdaHandler: 'gatewayLambda',
    timeoutMs: 5000,
  });
};
