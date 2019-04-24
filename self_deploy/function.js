'use strict'

const deploy = require('./deploy');

/**
 * @type { import("./binaris").Handler }
 */
exports.handler = async (body, context) => {
  const { funcName, func, runtime } = body;
  return deploy(funcName, func, runtime);
};
