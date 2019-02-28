const CORS = (handler) =>
  async (body, context) => {
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
    };
    if (context.request.method !== 'OPTIONS') {
      const output = await handler(body);
      response.headers['Content-Type'] = 'application/json';
      response.body = JSON.stringify(output);
    }
    return new context.HTTPResponse(response);
  };
;

exports.handler = CORS(async (body, context) => {
  return (typeof(body) === 'string' ? body : '').toUpperCase();
});
