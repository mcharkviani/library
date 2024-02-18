import { RequestHandler } from 'express';
import { parse } from 'url';

export const loggerMiddleware: RequestHandler = (request, response, next): void => {
  const { method } = request;

  const date: string = new Date().toJSON();
  const time: string = date.replace('T', ' ').slice(0, -5);
  const route: string = parse(request.url).path;

  console.log(`${time} ~ ${method} ${route || '/'}`);

  next();
};
