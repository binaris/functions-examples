const { createClient } = require('async-redis');

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

/**
 * @summary Creates an async Redis client.
 * @param {string} [host] Redis service hostname. Defaults to process.env.REDIS_HOST
 * @param {string} [port] Redis service port. Defaults to process.env.REDIS_PORT
 * @param {string} [password] Redis service password. Defaults to process.env.REDIS_PASSWORD
 * @example
 * const { getRedisClient } = require('./redis');
 *
 * const redis = getRedisClient();
 *
 * const f = async (s) => {
 *   console.log(await redis.echo(s));
 *   redis.quit();
 * };
 *
 * f('hi');
 */

function getRedisClient(host = REDIS_HOST, port = REDIS_PORT, password = REDIS_PASSWORD) {
  const options = { host, port };
  if (password && password !== '') {
    options.password = password;
  }
  return createClient(options);
}

module.exports = { getRedisClient };
