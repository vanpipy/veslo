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
    const [port, handle] = args;

    server.listen(port as number, handle as () => void);
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

  logger.debug(`> [Start] to run middlewares task(${middlewaresLength})`);

  if (middlewares.length === 0) {
    logger.debug(`> [Stop] cause middlewares task(${middlewaresLength}) are empty`);

    if (typeof done === 'function') {
      logger.debug('> [Done] cause middlewares task was empty');
      done();
    }

    logger.debug('> [End] middlewares task');

    return;
  }

  const task = (req: Request, res: Response, middlewares: Middleware[], current: number) => {
    logger.debug(`|-> [Start] middleware task {${current + 1}/${middlewaresLength}}`);

    const next = () => {
      if (current + 1 >= middlewaresLength) {
        logger.debug(`|-> [End] at ${current + 1}/${middlewaresLength} with the task[${current}]`);
        logger.debug('> [End] the running middlewares task');

        if (typeof done === 'function') {
          logger.debug('> [Done] cause the middlewares task was ended');
          done();
        }

        return;
      }

      if (current + 1 < middlewaresLength) {
        logger.debug(`|-> [Start] to trigger the next middleware task {${current + 2}/${middlewaresLength}}`);
        task(req, res, middlewares, current + 1);
      }
    };

    logger.debug(`|-> [Create] an immediate task {${current + 1}/${middlewaresLength}}`);

    const immediateTask = () => {
      logger.debug(`|-> [Run] the immediate task {${current + 1}/${middlewaresLength}}`);

      try {
        logger.debug(`|-> [Running] the immediate task {${current + 1}/${middlewaresLength}}`);

        const middle = middlewares[current];
        middle({ req, res, app }, next);

        logger.debug(`|-> [Done] the immediate task {${current + 1}/${middlewaresLength}}`);
      } catch (err) {
        logger.debug(`|-> [Error] with immediate task ${current + 1}/${middlewaresLength}`);
        logger.error(err);
        handleExecuteError(res, err as Error);
      }
    };

    setImmediate(immediateTask);

    logger.debug(`|-> [Created] the immediate task {${current + 1}/${middlewaresLength}}`);
  };

  task(req, res, middlewares, 0);
}
