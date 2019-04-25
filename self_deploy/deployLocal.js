#!/usr/bin/env node
const { promisify } = require('util');
const { readFile } = require('fs');
const invoke = require('binaris/lib/invoke');
const yargs = require('yargs');

const asyncRead = promisify(readFile);

async function localDeploy({ filePath, funcName, runtime }) {
  const functionRepr = await asyncRead(filePath, 'utf8');
  const funcData = {
    funcName,
    runtime,
    func: functionRepr,
  }
  const URL = await invoke('deployer', JSON.stringify(funcData));
  console.log(URL.body);
}

yargs
  .command('faasDeploy <funcName> <filePath> [options]', '', (yargs0) => {
    yargs0
      .usage('Usage: $0 faasDeploy <funcName> <filePath> [options]')
      .positional('funcName', {
        describe: 'name of function being deployed'
      })
      .positional('filePath', {
        describe: 'path to function you want to deploy'
      })
      .option('runtime', {
        alias: 'r',
        default: 'node8',
      })
    }, localDeploy)
  .demandCommand(1, 'Please provide at least 1 valid command')
  .wrap(null)
  .argv
