'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'cart';

exports.addItem = async (body, context) => {
  const quantity = body.quantity || 1;
  if (body.item === undefined) {
    throw new Error('"item" body parameter required!');
  }
  return client.hincrby(KEY, body.item, quantity);
};

exports.getAllItems = async () => {
  return client.hgetall(KEY);
}
