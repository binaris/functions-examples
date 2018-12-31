const { invoke } = require('binaris/sdk');
const { 
  BINARIS_ACCOUNT_ID, 
  BINARIS_API_KEY, 
  BN_FUNCTION 
} = process.env;

const execute = async (command, field, value) => {
  const request = {
    command: command,
    key: 'TodoBackend',
    field: field,
    value: JSON.stringify(value)
  };
  const response = await invoke(BINARIS_ACCOUNT_ID, 'TodoRedis', BINARIS_API_KEY, JSON.stringify(request));
  const body = JSON.parse(response.body);
  return body
    ? (Array.isArray(body) ? body.map(JSON.parse) : JSON.parse(body))
    : undefined;
}

const cors = handler => async (body, context) => {
  const response = await handler(body, context);

  return new context.HTTPResponse({
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PATCH',
    },
    body: JSON.stringify(response)
  });
};

const handler = async (body, context) => {
  let id = context.request.path.substring(1);

  switch (context.request.method) {

    case 'GET': {
      if (id) {     
        return await execute('hget', id);
      } else {
        const items = await execute('hvals');
        return items.sort(i => i.order);
      }
    }

    case 'POST': {
      const generatedId = Math.random().toString(36).substring(2);
      const todo = { 
        completed: false,
        id: generatedId,
        url: `https://run-sandbox.binaris.com/v2/run/${BINARIS_ACCOUNT_ID}/${BN_FUNCTION}/${generatedId}`,
        ...body 
      };
      return await execute('hset', generatedId, todo);
    }

    case 'DELETE': {
      if (id) {
        await execute('hdel', id);
      } else {
        await execute('del');
      }
      return;
    }

    case 'PATCH': {
      const existing = await execute('hget', id);

      const todo = { ...existing, ...body };
      return await execute('hset', todo.id, todo);
    }
  }
};

exports.handler = cors(handler);