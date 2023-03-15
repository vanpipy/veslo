import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { unescape } from 'node:querystring';
import { match } from 'path-to-regexp';
import Request from './Request';
import Response from './Response';

export type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';

export type Context = {
  req: Request;
  res: Response;
  app: Veslo;
};

export type Middleware = (context: Context, next: () => unknown | Promise<unknown>) => unknown;

type Route = {
  path: string;
  method: Method;
  stack: Middleware[];
};

const WELCOME = 'Hi, I am veslo';

const immediateTask = (callback: () => unknown): unknown =>
  new Promise((resolve, reject) => {
    try {
      setImmediate(() => {
        const result = callback();
        resolve(result);
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });

export default class Veslo extends EventEmitter {
  private settings: Record<string, unknown> = {};
  private routes: Middleware[] = [];
  private stack: Middleware[] = [];

  set(key: string, value: unknown) {
    this.settings[key] = value;
  }

  get(key: string) {
    return this.settings[key];
  }

  route(route: Route) {
    const { path, method, stack } = route;
    const matcher = match(path, { decode: unescape });
    const routeTask: Middleware = async (context, next) => {
      const { req, res, app } = context;

      if (matcher(req.url as string) && req.method === method) {
        await runMiddlewaresTask(req, res, app, stack);
      }

      next();
    };
    this.routes.push(routeTask);
  }

  use(middleware: Middleware) {
    this.stack.push(middleware);
  }

  async run(req: Request, res: Response) {
    if (this.routes.length === 0) {
      res
        .writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': WELCOME.length,
        })
        .end(WELCOME);
      return;
    }

    try {
      const { routes, stack } = this;
      const middlewares = [...stack];
      await runMiddlewaresTask(req, res, this, middlewares);
      await runMiddlewaresTask(req, res, this, routes);
    } catch (err) {
      console.log(err);
    }
  }

  listen(...args: unknown[]) {
    const server = createServer(
      {
        IncomingMessage: Request,
        ServerResponse: Response,
      },
      (req, res) => {
        void this.run(req, res);
      }
    );

    server.listen(args);
  }
}

async function runMiddlewaresTask(req: Request, res: Response, app: Veslo, middlewares: Middleware[]) {
  if (middlewares.length === 0) {
    return;
  }

  const task = async (req: Request, res: Response, middlewares: Middleware[], current: number): Promise<unknown> => {
    const middle = middlewares[current];
    const next = () => {
      current += 1;

      if (current >= middlewares.length) {
        return;
      }

      if (current < middlewares.length) {
        return task(req, res, middlewares, current);
      }
    };

    return await immediateTask(() => {
      return middle({ req, res, app }, next);
    });
  };

  return await task(req, res, middlewares, 0);
}
