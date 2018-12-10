const { inspect } = require('util');
const { invoke } = require('binaris/sdk');

const { BINARIS_API_KEY } = process.env;

/**
 * @private
 * @summary Convenient object serializer for logging.
 */
const format = function format(obj) {
  return inspect(obj, { breakLength: Infinity, depth: 5 });
};

/**
 * @summary A wrapper for invoking a Binaris function.
 * @description Invokes a Binaris function that expects a JSON input and
 * returns a JSON output. Parses and stringifies the JSON to and from JS
 * objects.
 * @param {string} functionName
 * @param {Object} params The input parameters to the function.
 * @param {string} [binarisAPIKey]
 */
const invokeJSON = async function invokeJSON(functionName, params, binarisAPIKey = BINARIS_API_KEY) {
  const response = await invoke(functionName, binarisAPIKey, JSON.stringify(params));
  return JSON.parse(response.body);
};

module.exports = { format, invokeJSON };
