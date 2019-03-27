const request = (() => {
  const https = require('https');
  const agent = new https.Agent({ keepAlive: true });
  return (method, host, path, headers, body) => {
    return new Promise((resolve, reject) => {
      const opts = { method, host, path, headers, agent, port: 443 };
      const req = https.request(opts, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => (res.statusCode === 200 ? resolve : reject)({
          status: res.statusCode,
          headers: res.headers,
          body: chunks.join('')
        }));
      });
      req.on('error', e => reject({
       status: -1,
        headers: {},
        body: `Network error: ${e}`
      }));
      req.write(body);
      req.end();
    });
  };
})();

const invoke = async (fname, fargs) => {
  console.log(`Invoking ${fname}()`);
  if (typeof(fname) !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fname)) {
    throw new Error(`Invalid function name: ${fname}`);
  }
  const headers = { 'content-type': 'application/json' };
  if (!fname.startsWith('public_')) {
    if (!process.env.BINARIS_ACCOUNT_ID) {
      throw new Error(`Missing API key for invoking protected function: ${fname}`);
    }
    headers['X-Binaris-Api-Key'] = process.env.BINARIS_ACCOUNT_ID;
  }
  const response = await request('post',
                                 'run.binaris.com',
                                 `/v2/run/${process.env.BINARIS_ACCOUNT_ID}/${fname}`,
                                 headers,
                                 JSON.stringify(fargs));
  console.log(`${fname}() -> ${response.body}`);
  if (!response.headers['content-type'].startsWith('application/json')) {
    throw new Error(`Invalid response type: ${response.headers['content-type']}`);
  }
  return response.body.length ? JSON.parse(response.body) : undefined;
};

exports.controller = async job => {
  console.log(`Starting MapReduce job with ${job.inputs.length} mappers...`);
  job.reduce.inputs = await Promise.all(job.inputs.map(i => invoke(job.mapper, i)));
  console.log('Reducing...');
  const result = await invoke(job.reducer, job.reduce);
  console.log(`MapReduce result is ${result}`);
  return result;
};
