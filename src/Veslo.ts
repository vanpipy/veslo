import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { unescape } from 'node:querystring';
import { match } from 'path-to-regexp';
import Request from './Request';
import Response from './Response';

export type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH';

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
        runMiddlewaresTask(stack, { req, res, app });
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
    const done = () => {
      handleNotFoundError(req, res);
    };
    runMiddlewaresTask([...stack, ...routes], { req, res, app: this, done });
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

function handleExecuteError(res: Response, Exception: Error) {
  setImmediate(() => {
    const { message: errorMessage } = Exception;
    res
      .writeHead(500, {
        'Content-Type': 'text/html',
      })
      .end(`500\nServer Error\n${errorMessage}`);
  });
}

function handleNotFoundError(req: Request, res: Response) {
  setImmediate(() => {
    if (req.resolved !== true && Exception.length === 0) {
      res
        .writeHead(404, {
          'Content-Type': 'text/html',
        })
        .end(`404\n${req.url as string} ${req.method as string} Cannot Found`);
    }
  });
}

function runMiddlewaresTask(
  middlewares: Middleware[],
  options: {
    req: Request;
    res: Response;
    app: Veslo;
    done?: () => void;
  }
) {
  const { req, res, app, done } = options;

  if (middlewares.length === 0) {
    if (typeof done === 'function') {
      done();
    }

    return;
  }

  const task = (req: Request, res: Response, middlewares: Middleware[], current: number) => {
    const next = () => {
      current += 1;

      if (current >= middlewares.length || Exception.length) {
        if (typeof done === 'function') {
          done();
        }
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
        handleExecuteError(res, err as Error);
        console.error(err);
      }
    });
  };

  task(req, res, middlewares, 0);
}
