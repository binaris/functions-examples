const invoke = (() => {
  const request = require('request-promise-native');

  return async (fname, fargs) => {
    console.log(`Invoking ${fname}()`);
    const uri = `https://run.binaris.com/v2/run/${process.env.BINARIS_ACCOUNT_ID}/${fname}`;
    const res = await request.post(uri, {
      json: true,
      body: fargs
    });
    console.log(`${fname}() -> ${res}`);
    return res;
  };
})();

const getRedisConnection = (() => {
  const Redis = require('ioredis');
  const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

  const connectToRedis = () => {
    console.log(`Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
    return new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      tls: { rejectUnauthorized: false },
    });
  };

  let redis;
  return () => redis || (redis = connectToRedis());
})();

exports.controller = async job => {
  job.uid = `job${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  console.log('amr: Starting job', job.uid);
  const redis = getRedisConnection();
  console.log(`amr: Queueing ${job.inputs.length} mappers`);
  for (let i = 0; i < job.inputs.length; i++) {
    job.index = i;
    await redis.xadd('inputs', '*', 'input', JSON.stringify(job));
  }
};

exports.mapper = async input => {
  const redis = getRedisConnection();
  const job = JSON.parse(input.fields.toString('utf8').substr(6));

  const mapResult = await invoke(job.mapper, job.inputs[job.index]);
  await redis.hset(job.uid, job.index, mapResult);

  const count = await redis.incr(`${job.uid}.counter`); // atomic
  if (count < job.inputs.length) {
    return;
  }

  const inputs = await redis.hgetall(job.uid);
  job.reduce.inputs = Object.values(inputs);
  const reduceResult = await invoke(job.reducer, job.reduce);
  console.log('amr: MapReduce =>', reduceResult);
};
