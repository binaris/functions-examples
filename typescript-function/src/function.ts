import { FunctionContext } from './binaris';

interface DataWithName { name: string; }

export async function handler(body: unknown, ctx: FunctionContext): Promise<string> {
  let name: string = 'World';
  if (typeof(ctx.request.query.name) === 'string') {
    name = ctx.request.query.name;
  } else if ((body !== undefined) && Object.prototype.hasOwnProperty.call(body, 'name')) {
    name = (body as DataWithName).name;
  }
  return `Hello ${name}!`;
}
