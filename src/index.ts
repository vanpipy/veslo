import Veslo, { Middleware } from './Veslo';

function bootstrap() {
  const app = new Veslo();
  return app;
}

export { Veslo, Middleware };
export default bootstrap;
