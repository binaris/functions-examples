const Redis = require('ioredis');

const {
  REDIS_PORT: port,
  REDIS_HOST: host,
  REDIS_PWD: password,
} = process.env;

const redis = new Redis({
  port,
  host,
  family: 4,
  password,
  db: 0,
});

exports.handler = async (input) => {
  const { command, key, field, value } = {...input};
  switch (command) {
    case 'hset': {
      await redis.hset(key, field, value);
      return value;
    }
    case 'hget': {
      return await redis.hget(key, field);
    }
    case 'hvals': {
      return await redis.hvals(key);
    }
    case 'hdel': {
      await redis.hdel(key, field);
      return '';
    }
    case 'del': {
      await redis.del(key);
      return '';      
    }
  }
  return '';
};
