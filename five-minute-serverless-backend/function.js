const CORS = (handler) =>
  async (body, context) => {
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    };
    if (context.request.method === 'OPTIONS') {
      response.headers['Access-Control-Allow-Headers'] = context.request.headers['access-control-request-headers'];
    } else {
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
