'use strict';

const Redis = require('ioredis');
const IPLocator = require('node-iplocate');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'geoViews';

async function resolveLocation(body, context) {
  if (body !== undefined && body.ip !== undefined) {
    return IPLocator(body.ip);
  }
  const callerIP = context.request.headers['x-forwarded-for'].split(',')[0];
  return IPLocator(callerIP);
}

exports.handler = async (body, context) => {
  const resolved = await resolveLocation(body, context);
  await client.geoadd(KEY, resolved.longitude, resolved.latitude, resolved.ip);
  return 'ok';
};

exports.geoDistribution = async (body, context) => {
  const radiusInMiles = context.request.query.radiusInMiles || body.radiusInMiles || 100;
  const resolved = await resolveLocation(body, context);
  return client.georadius(KEY, resolved.longitude, resolved.latitude, radiusInMiles, 'mi');
}
