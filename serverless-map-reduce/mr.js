const { invoke } = require('./invoke');

/**
 * public_mr_controller() - Run a sync (naive) map-reduce job. Invoke all
 * mappers, wait and invoke the reducer.
 *
 * @param {object} [job] Description of MapReduce job
 */
exports.controller = async job => {

  // Invoke all mappers and wait
  console.log(`Starting MapReduce job with ${job.inputs.length} mappers...`);
  job.reduce.inputs = await Promise.all(job.inputs.map(i => invoke(job.mapper, i)));

  // Invoke the reducer
  console.log('Reducing...');
  const result = await invoke(job.reducer, job.reduce);

  // We're done!
  console.log(`MapReduce result is ${result}`);
  return result;
};
