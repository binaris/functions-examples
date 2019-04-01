'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'tasks';

exports.handler = async (body, context) => {
  if (body.task === undefined) {
    throw new Error('"task" body parameter required!');
  }
  return client.rpush(KEY, body.task);
};

exports.getNextTask = async () => {
  const nextTask = await client.lpop(KEY);
  return (nextTask === null) ? 'No tasks remain!' : nextTask;
}
