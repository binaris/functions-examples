const Redis = require('ioredis');

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PWD,
} = process.env;

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PWD,
  family: 4,
  db: 0,
});

exports.handler = async (input) => {
  const { command, key, field, value } = { ...input };
  switch (command) {
    case 'hset': {
      await redis.hset(key, field, value);
      return value;
    }
    case 'hget': {
      return redis.hget(key, field);
    }
    case 'hvals': {
      return redis.hvals(key);
    }
    case 'hdel': {
      await redis.hdel(key, field);
      return '';
    }
    case 'del': {
      await redis.del(key);
      return '';
    }
    default: {
      return '';
    }
  }
};
