import request from 'supertest';
import { expect } from 'chai';
import Sinon from 'sinon';
import Veslo from '../src/Veslo';
import requestLogger from '../plugins/requestLogger';

describe('requestLogger', () => {
  const app = new Veslo({ logger: { level: 'debug', transport: { target: 'pino-pretty' } } });
  app.use(requestLogger);
  app.route({
    path: '/test',
    method: 'GET',
    stack: [
      ({ res }) => {
        res.end('0');
      },
    ],
  });
  const spied = Sinon.spy(global.console, 'log');
  let clock: Sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = Sinon.useFakeTimers({
      toFake: ['Date'],
    });
  });

  afterEach(() => {
    clock.restore();
  });

  it('should console the time when requesting', async () => {
    const server = app.run.bind(app);
    const response = await request(server).get('/test');
    expect(response.statusCode).to.eq(200);
    clock.tick(300);
    expect(spied.callCount).to.eq(2);
    expect(spied.withArgs('[<=] [%s] [%s] Incoming message', '1970-1-1 8:0:0', '/test').called).to.eq(true);
    expect(spied.withArgs('[=>] [%s] [%s] Time cost: %dms', '1970-1-1 8:0:0', '/test', 0).called).to.eq(true);
  });
});
