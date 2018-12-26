const { getRedisClient } = require('./redis');

const redisClient = getRedisClient();

/**
 * @summary Fetches all the segments in the whiteboard
 * @returns An array of { x1, y1, x2, y2, color } objects
 * @example
 * bn invoke get
 * [{"x1":234,"y1":253,"x2":235,"y2":252,"color":"ee00ee"},
 *  {"x1":235,"y1":252,"x2":249,"y2":265,"color":"ee00ee"},
 * ...
 * ]
 */
async function getSegments() {
  const segments = await redisClient.lrange('segments', 0, -1);
  return segments.map(JSON.parse);
}

exports.handler = async (input, ctx) => new ctx.HTTPResponse({
  body: JSON.stringify(await getSegments()),
  headers: { 'Access-Control-Allow-Origin': '*' },
});

// Expose some internals for testing.
exports.t = { getSegments };
