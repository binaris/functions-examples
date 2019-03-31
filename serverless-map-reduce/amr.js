const request = require('request-promise-native');
const Redis = require('ioredis');

/**
 * Post an HTTP request to invoke a Binaris function.
 *
 * @param {string} [fname] Name of function to invoke
 * @param {object} [fargs] Input arguments
 *
 * @return {object} Result returned from the function
 */
const invoke = async (fname, fargs) => {
  console.log(`Invoking ${fname}()`);
  const res = await request.post({
    uri: `https://run.binaris.com/v2/run/${process.env.BINARIS_ACCOUNT_ID}/${fname}`,
    json: true,
    body: fargs
  });
  console.log(`${fname}() -> ${res}`);
  return res;
};

// Connect to Redis
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  tls: { rejectUnauthorized: false },
});

/**
 * public_amr_controller() - Start an async map-reduce job by posting
 * invocations of function public_amr_mapper() into a Redis stream.
 *
 * @param {object} [job] Description of MapReduce job to start
 */
exports.controller = async job => {

  // Generate a random string for a job ID
  job.uid = `job${Math.random().toString(36).substring(2, 15)}`;
  console.log(`amr: Starting job ${job.uid}`);

  // Post async invocation requests into a Redis stream
  console.log(`amr: Queueing ${job.inputs.length} mappers`);
  for (let i = 0; i < job.inputs.length; i += 1) {
    job.index = i;
    await redis.xadd('inputs', '*', 'input', JSON.stringify(job));
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
  const job = JSON.parse(input.fields.toString('utf8').substr(6));

  // Invoke the user's mapper function
  const mapResult = await invoke(job.mapper, job.inputs[job.index]);
  await redis.hset(job.uid, job.index, mapResult);

  // Increment an atomic counter to detemine if all mappers are done
  const count = await redis.incr(`${job.uid}.counter`);
  if (count < job.inputs.length) {
    return;
  }

  // Invoke the reducer with the results of all mappers
  const inputs = await redis.hgetall(job.uid);
  job.reduce.inputs = Object.values(inputs);
  const reduceResult = await invoke(job.reducer, job.reduce);

  // We're done!
  console.log(`amr: MapReduce => ${reduceResult}`);
};
