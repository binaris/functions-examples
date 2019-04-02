const Redis = require('ioredis');
const { invoke } = require('./invoke');

// Connect to Redis
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  tls: {},
});

/**
 * public_amr_controller() - Start an async map-reduce job by posting
 * invocations of function public_amr_mapper() into a Redis stream.
 *
 * @param {object} [job] Description of MapReduce job to start
 */
exports.controller = async job => {

  // Generate a random string for a job ID
  const uid = `job${Math.random().toString(36).substring(2, 15)}`;
  console.log(`amr: Starting job ${uid}`);

  // Post async invocation requests into a Redis stream
  console.log(`amr: Queueing ${job.inputs.length} mappers`);
  for (let index = 0; index < job.inputs.length; index += 1) {
    await redis.xadd('inputs', '*', 'input', JSON.stringify({ ...job, index, uid }));
  }
};

/**
 * public_amr_mapper() - Invoke one instance of the user's mapper function
 * and, in case all mappers are done, invoke the user's reducer function.
 *
 * @param {object} [input] Description of MapReduce job with details of
 *                         the specific map operation to perform
 */
exports.mapper = async input => {

  // Parse the input from the stream element
  const job = JSON.parse(input.fields[0][1].toString('utf8'));

  // Invoke the user's mapper function
  const mapResult = await invoke(job.mapper, job.inputs[job.index]);

  // Atomically store map result in Redis and get the results count
  const res = await redis.pipeline()
    .hset(job.uid, `${job.index}`, `${mapResult}`)
    .hlen(job.uid)
    .exec();
  const len = res[1][1];
  if (len < job.inputs.length) {
    return;
  }

  // Invoke the reducer with the results of all mappers
  const inputs = await redis.hgetall(job.uid);
  job.reduce.inputs = Object.values(inputs);
  const reduceResult = await invoke(job.reducer, job.reduce);

  // We're done!
  console.log(`amr: MapReduce => ${reduceResult}`);
};
