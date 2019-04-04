'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'name';

exports.setName = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  await client.set(KEY, name);
  return 'ok';
};

exports.getName = async (body) => {
  const name = await client.get(KEY);
  return `Hello ${name}!`;
};
