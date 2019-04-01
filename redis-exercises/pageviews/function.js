'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

// INCR operation will create key if it does not exist
const KEY = 'numViews';

exports.handler = async (body, context) => {
  return client.incr(KEY);
};
