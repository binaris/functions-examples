'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'uniqueViews';

exports.uniqueView = async (body, context) => {
  const userId = context.request.query.userId || body.userId;
  if (userId === undefined) {
    throw new Error('"userId" body/query parameter required!');
  }

  return client.setbit(KEY, userId, 1);
};

exports.getUniqueViews = async (body, context) => {
  return client.bitcount(KEY);
}
