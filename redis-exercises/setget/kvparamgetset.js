'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

function validatedBody(body, ...fields) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      throw new Error(`Missing request body parameter: ${field}.`);
    }
  }
  return body;
}

exports.handler = async (body) => {
  const { key, value } = validatedBody(body, 'key', 'value');
  await client.set(key, value);
  return value;
};

exports.get = async (body) => {
  const { key } = validatedBody(body, 'key');
  return client.get(key);
};
