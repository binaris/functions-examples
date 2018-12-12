/* eslint-disable no-console,no-bitwise */
const noiseGen = require('./noiseGen');
const simplify = require('./simplify');

function makeHeaders(blockCount, maxHeight,
  payloadBytes, genTime) {
  const statusHeaders = {
    'X-Gen-Data-Blockcount': blockCount,
    'X-Gen-Data-Max-Height': maxHeight,
    'X-Gen-Data-Payload-Bytes': payloadBytes,
    'X-Gen-Data-Time-Running-MS': genTime,
  };
  const customHeaders = {
    'Access-Control-Expose-Headers': Object.keys(statusHeaders).join(', '),
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin X-Requested-With, Content-Type, Accept',
    ... statusHeaders,
  };
  return customHeaders;
}

exports.handler = async (body, ctx) => {
  const {
    downscale,
    heightFactor,
    numTex,
    size,
    xPos,
    yPos,
    zPos,
  } = ctx.request.query;

  let respBody;
  let headers;
  let statusCode = 500;
  const genStartTime = process.hrtime();

  const { blockCount, data, maxHeight } = noiseGen(
    parseInt(xPos, 10), parseInt(yPos, 10),
    parseInt(zPos, 10), parseInt(size, 10),
    downscale, parseInt(heightFactor, 10)
  );
  if (blockCount === 0) {
    const failedGenTime = process.hrtime(genStartTime);
    const genStr = (failedGenTime[0] * 1000) + (failedGenTime[1] / 1000000);
    headers = makeHeaders(blockCount, maxHeight, 0, genStr);
    respBody = new Buffer(2);
    statusCode = 200;
  } else {
    const { indices, mats, normals, tex, verts } = simplify(
      data, size, size, size,
      parseInt(xPos, 10), parseInt(yPos, 10),
      parseInt(zPos, 10), heightFactor, numTex,
    );

    // how many elements make up the lookup table
    const tableElements = 4;

    const mergedData = new Int16Array(verts.length + indices.length
      + normals.length + tex.length + mats.length + tableElements);

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
    mergedData.set(tex, tableElements + verts.length + normals.length);
    mergedData.set(mats, tableElements + verts.length + normals.length + tex.length);
    mergedData.set(indices, verts.length + tableElements + normals.length + tex.length + mats.length);

    respBody = Buffer.from(mergedData.buffer);
    console.log(`buffer size is ${respBody.length / 1000}`);

    const genTime = process.hrtime(genStartTime);
    const genDataTimeStr = (genTime[0] * 1000) + (genTime[1] / 1000000);
    headers = makeHeaders(blockCount, maxHeight, respBody.length, genDataTimeStr);
    statusCode = 200;
  }
  if (ctx.request.query.express_server) {
    ctx.set(headers);
    return ctx.send(respBody);
  }
  return new ctx.HTTPResponse({
    statusCode,
    headers,
    body: respBody,
  });
};
