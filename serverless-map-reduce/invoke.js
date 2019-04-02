const request = require('request-promise-native');

/**
 * Post an HTTP request to invoke a Binaris function.
 *
 * @param {string} [fname] Name of function to invoke
 * @param {object} [fargs] Input arguments
 *
 * @return {object} Result returned from the function
 */
exports.invoke = async (fname, fargs) => {
  console.log(`Invoking ${fname}()`);
  const res = await request.post({
    uri: `https://run.binaris.com/v2/run/${process.env.BINARIS_ACCOUNT_ID}/${fname}`,
    json: true,
    body: fargs
  });
  console.log(`${fname}() -> ${res}`);
  return res;
};
