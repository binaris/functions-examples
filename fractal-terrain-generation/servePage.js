/* eslint-disable no-console */

const fs = require('mz/fs');
const mime = require('mime-types');
const path = require('path');

const prefix = './dist';

exports.handler = async (body, ctx) => {
  let resourcePath = ctx.request.path;
  console.log(`body ${JSON.stringify(body)}`);
  console.log(`path is ${resourcePath}`);

  if (resourcePath === '/' || resourcePath === undefined) {
    resourcePath = '/index.html';
  }

  const webpage = await fs.readFile(`${prefix}${resourcePath}`);
  const resourceType = mime.contentType(path.extname(resourcePath));

  return new ctx.HTTPResponse({
    statusCode: 200,
    headers: {
      'Content-Type': resourceType,
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept',
    },
    body: webpage,
  });
};
