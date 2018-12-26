const pusher = require('./pusher');
const { getRedisClient } = require('./redis');

const redisClient = getRedisClient();

async function deleteSegments() {
  return redisClient.del('segments');
}

exports.handler = async (input, ctx) => {
  await deleteSegments();
  await pusher.trigger('WHITEBOARD', 'clear', {});
  return new ctx.HTTPResponse({
    statusCode: 202,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ status: 'cleared' }),
  });
};

// Expose some internals for testing.
exports.t = { deleteSegments };
