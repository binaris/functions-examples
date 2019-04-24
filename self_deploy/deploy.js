const { join } = require('path');
const { promisify } = require('util');
const { writeFile } = require('fs');
const tmp = require('tmp-promise');

const deploy = require('binaris/lib/deploy');
const writeAsync = promisify(writeFile);

function getExtByRuntime(runtime) {
  const runtimes = {
    node8: 'js',
    python2: 'py',
    python3: 'py',
    pypy2: 'py',
  };
  if (!Object.prototype.hasOwnProperty.call(runtimes, runtime)) {
    throw new Error(`No valid extension found for runtime ${runtime}`);
  }
  return runtimes[runtime];
}

async function innerDeploy(funcName, func, runtime = 'node8') {
  const functionConf = {
    file: `function.${getExtByRuntime(runtime)}`,
    entrypoint: 'handler',
    runtime,
  };
  const dirHandle = await tmp.dir();
  const fullPath = join(dirHandle.path, functionConf.file);
  await writeAsync(fullPath, func);
  await deploy(funcName, dirHandle.path, functionConf);
}

module.exports = innerDeploy;
