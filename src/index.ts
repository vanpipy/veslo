import { PathOrFileDescriptor, readFileSync } from 'node:fs';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import Request from './Request';
import Response from './Response';
import Veslo, { Middleware } from './Veslo';

type ServerOptions = {
  https?: boolean;
  certpath?: {
    key: PathOrFileDescriptor;
    cert: PathOrFileDescriptor;
  };
};

function bootstrap(options?: ServerOptions) {
  const { https = false, certpath } = options || {};
  const { key, cert } = certpath || {};
  const app = new Veslo();
  const createServer: typeof nodeHttp.createServer = https ? nodeHttps.createServer : nodeHttp.createServer;

  app.listen = (port, handler) => {
    const addition: AnyObject = {};
    if (https) {
      try {
        addition.key = readFileSync(key as PathOrFileDescriptor);
        addition.cert = readFileSync(cert as PathOrFileDescriptor);
      } catch (err) {
        console.error(
          `Please check your local key and cert\nkey:\n ${String(key)}\n${addition.key as string}\ncert:\n ${String(
            cert
          )}\n${addition.cert as string}`
        );
        console.error(err);
        return;
      }
    }
    const server = createServer(
      {
        ...addition,
        IncomingMessage: Request,
        ServerResponse: Response,
      },
      (req, res) => {
        void app.run(req, res);
      }
    );
    server.listen(port, handler);
  };

  return app;
}

export { Veslo, Middleware };
export default bootstrap;
