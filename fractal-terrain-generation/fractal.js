/* eslint-disable no-console,no-bitwise */

const fs = require('mz/fs');
const mime = require('mime-types');
const path = require('path');

const noiseGen = require('./function_lib/noiseGen');
const simplify = require('./function_lib/simplify');

const prefix = './dist';

async function servePage(body, ctx) {
  let resourcePath = ctx.request.path;
  console.log(`body ${JSON.stringify(body)}`);
  console.log(`path is ${resourcePath}`);

  if (resourcePath === '/' || resourcePath === undefined) {
    resourcePath = '/index.html';
  }

  const webpage = await fs.readFile(`${prefix}${resourcePath}`);
  const resourceType = mime.contentType(path.extname(resourcePath));

  return new ctx.Response({
    statusCode: 200,
    headers: {
      'Content-Type': resourceType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    },
    body: webpage,
  });
}

exports.handler = async (body, ctx) => {
  if (ctx.request.path === '/generate') {
    const { size, xPos, zPos, downscale, heightFactor } = ctx.request.query;

    const genStartTime = process.hrtime();

    const { blockCount, data, maxHeight } = noiseGen(
      parseInt(xPos, 10), parseInt(zPos, 10), size,
      downscale, heightFactor
    );
    const { verts, indices, normals, tex } = simplify(
      data, size, maxHeight, size,
      parseInt(xPos, 10), parseInt(zPos, 10)
    );

    // how many elements make up the lookup table
    const tableElements = 4;

    const mergedData = new Int16Array(verts.length + indices.length
      + normals.length + tex.length + tableElements);

    // this is an unfortunate bit of logic required to make sure
    // that our buffers length value doesn't get truncated/overflowed
    // in the lookup table.
    function split32BitValue(value) {
      return [value & 0xFFFF, (value >> 16) & 0xFFFF];
    }
    const splitVertsLength = split32BitValue(verts.length);
    const splitTexLength = split32BitValue(tex.length);
    mergedData[0] = splitVertsLength[0];
    mergedData[1] = splitVertsLength[1];
    mergedData[2] = splitTexLength[0];
    mergedData[3] = splitTexLength[1];

    mergedData.set(verts, tableElements);
    mergedData.set(normals, tableElements + verts.length);
    mergedData.set(indices, verts.length + tableElements + normals.length + tex.length);

    const buffer = Buffer.from(mergedData.buffer);
    console.log(`buffer size is ${buffer.length / 1000}`);

    const genTime = process.hrtime(genStartTime);
    const genDataTimeStr = (genTime[0] * 1000) + (genTime[1] / 1000000);
    const customHeaders = {
      'Gen-Data-Blockcount': blockCount,
      'Gen-Data-Max-Height': maxHeight,
      'Gen-Data-Payload-Bytes': buffer.length,
      'Gen-Data-Time-Running-MS': genDataTimeStr,
    };

    return new ctx.Response({
      statusCode: 200,
      headers: {
        'Access-Control-Expose-Headers': Object.keys(customHeaders).join(','),
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        ...customHeaders,
      },
      body: buffer,
    });
  }
  return servePage(body, ctx);
};
