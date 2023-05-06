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

type Unknown = unknown | Promise<unknown>;

export type Middleware = (context: Context, next: () => Unknown) => Unknown;

type Route = {
  path: string;
  method: Method;
  stack: Middleware[];
};

const WELCOME = 'Hi, I am veslo';

const Exception: Error[] = [];

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
    const routeTask: Middleware = ({ req, res, app }, next) => {
      const matched = matcher(req.url as string);

      if (matched && req.method === method && req.resolved !== true) {
        req.resolved = true;
        req.params = matched.params;
        runMiddlewaresTask(req, res, app, stack);
      }

      return next();
    };
    this.routes.push(routeTask);
  }

  use(middleware: Middleware) {
    this.stack.push(middleware);
  }

  run(req: Request, res: Response) {
    if (req.url === '/') {
      res
        .writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': WELCOME.length,
        })
        .end(WELCOME);
      return;
    }

    const { routes, stack } = this;
    runMiddlewaresTask(req, res, this, [...stack, ...routes]);

    setTimeout(() => {
      if (Exception.length) {
        const { message: errorMessage } = Exception[0];
        Exception.length = 0;
        res
          .writeHead(500, {
            'Content-Type': 'text/html',
          })
          .end(`500\nServer Error\n${errorMessage}`);
      }
    }, 0);

    setTimeout(() => {
      if (req.resolved !== true) {
        res
          .writeHead(404, {
            'Content-Type': 'text/html',
          })
          .end(`404\n${req.url as string} ${req.method as string} Cannot Found`);
      }
    }, 0);
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

function runMiddlewaresTask(req: Request, res: Response, app: Veslo, middlewares: Middleware[]) {
  if (middlewares.length === 0) {
    return;
  }

  const task = (req: Request, res: Response, middlewares: Middleware[], current: number) => {
    const next = () => {
      current += 1;

      if (current >= middlewares.length || Exception.length) {
        return;
      }

      if (current < middlewares.length) {
        task(req, res, middlewares, current);
      }
    };

    setImmediate(() => {
      try {
        const middle = middlewares[current];
        middle({ req, res, app }, next);
      } catch (err) {
        if (err instanceof Error) {
          Exception.push(err);
        }

        console.error(err);
      }
    });
  };

  task(req, res, middlewares, 0);
}
