'use strict';

module.exports.vanillaLambda = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'You just invoked a Lambda on Binaris!',
      input: event,
    }),
  };
};

module.exports.gatewayLambda = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'You just invoked a faux gateway Lambda on Binaris!',
      input: event,
    }),
  };
};
