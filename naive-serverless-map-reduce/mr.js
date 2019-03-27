const request = require('request-promise-native');

const invoke = async (fname, fargs) => {
  console.log(`Invoking ${fname}()`);
  const uri = `https://run.binaris.com/v2/run/${process.env.BINARIS_ACCOUNT_ID}/${fname}`;
  const res = await request.post(uri, {
    headers: { 'content-type': 'application/json' },
    json: true,
    body: fargs
  });
  console.log(`${fname}() -> ${res}`);
  return res;
};

exports.controller = async job => {
  console.log(`Starting MapReduce job with ${job.inputs.length} mappers...`);
  job.reduce.inputs = await Promise.all(job.inputs.map(i => invoke(job.mapper, i)));
  console.log('Reducing...');
  const result = await invoke(job.reducer, job.reduce);
  console.log(`MapReduce result is ${result}`);
  return result;
};
