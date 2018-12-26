const { getRedisClient } = require('./redis');

const redisClient = getRedisClient();

const pusher = require('./pusher');

async function saveSegments(segments) {
  redisClient.rpush(['segments'].concat(segments.map(JSON.stringify)));
}

exports.handler = async (message, ctx) => {
  await saveSegments(message.segments);
  await pusher.trigger('WHITEBOARD', 'draw', message);
  const logMessage = JSON.stringify({ segmentCount: message.segments.length });
  console.log(logMessage);
  return new ctx.HTTPResponse({
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: logMessage,
  });
};

// Expose some internals for testing.
exports.t = { saveSegments };
