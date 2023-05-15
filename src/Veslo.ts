import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { unescape } from 'node:querystring';
import { match } from 'path-to-regexp';
import pino from 'pino';
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

export default class Veslo extends EventEmitter {
  private settings: Record<string, unknown> = {};
  private routes: Middleware[] = [];
  private stack: Middleware[] = [];

  public logger: pino.Logger;

  constructor(config?: { logger?: pino.LoggerOptions & { logPath?: string } }) {
    super();

    const { logger = {} } = config || {};
    const { logPath = './veslo.log', ...rest } = logger;

    this.logger = pino(
      {
        name: 'veslo',
        ...rest,
      },
      pino.destination(logPath)
    );
  }

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
      handleRoorPath(res);
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

function handleRoorPath(res: Response) {
  res
    .writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': WELCOME.length,
    })
    .end(WELCOME);
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
    if (req.resolved !== true) {
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
  const middlewaresLength = middlewares.length;
  const { req, res, app, done } = options;
  const { logger } = app;

  logger.debug('Run middlewares task');

  if (middlewares.length === 0) {
    logger.debug('Stop cause middlewares task are empty');

    if (typeof done === 'function') {
      logger.debug('Done with the empty middlewares task');
      done();
    }

    logger.debug('End middlewares task');

    return;
  }

  const task = (req: Request, res: Response, middlewares: Middleware[], current: number) => {
    logger.debug(`Start middleware task {${current}}`);

    const next = () => {
      logger.debug('Try to trigger the next middleware task');

      current += 1;

      logger.debug(`Next middleware task {${current}} and the length of the middlewares task is ${middlewaresLength}`);

      if (current >= middlewaresLength) {
        logger.debug('Stop cause out of the middlewares');

        if (typeof done === 'function') {
          logger.debug('Done cause out of the middlewares');
          done();
        }
        return;
      }

      if (current < middlewaresLength) {
        logger.debug(`Trigger the middleware task {${current}}`);
        task(req, res, middlewares, current);
      }
    };

    logger.debug(`Create an immediate task{${current}}`);

    setImmediate(() => {
      logger.debug(`Run the immediate task {${current}}`);

      try {
        const middle = middlewares[current];
        middle({ req, res, app }, next);
      } catch (err) {
        handleExecuteError(res, err as Error);
        logger.error(err);
      }

      logger.debug(`Done the immediate task {${current}}`);
    });
  };

  task(req, res, middlewares, 0);
}
