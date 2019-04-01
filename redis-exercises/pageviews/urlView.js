'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

exports.handler = async (body, context) => {
  if (body === undefined || body.url === undefined) {
    throw new Error('No "url" parameter found in body!');
  }
  return client.incr(body.url);
};
