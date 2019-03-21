import { BinarisFunction } from './binaris';

interface DataWithName { name: string; }

function bodyHasName(body: unknown): body is DataWithName {
  return body && typeof (body as DataWithName).name === 'string';
}

export const handler: BinarisFunction = async (body, ctx): Promise<string> => {
  let name: string | undefined;
  if (typeof(ctx.request.query.name) === 'string') {
    name = ctx.request.query.name;
  } else if (bodyHasName(body)) {
    name = name || body.name;
  }
  name = name || 'World';
  return `Hello ${name}!`;
};
