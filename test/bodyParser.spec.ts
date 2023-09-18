import request from 'supertest';
import { expect } from 'chai';
import Veslo from '../src/Veslo';
import bodyParser from '../plugins/bodyParser';

describe('bodyParser', () => {
  const app = new Veslo();
  app.use(bodyParser);

  app.route({
    path: '/test',
    method: 'POST',
    stack: [
      (ctx) => {
        const { req, res } = ctx;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.body) || {});
      },
    ],
  });

  it('should parse the payload on req.body when request with method.post and the data', async () => {
    const data = { a: 1, b: '2', c: 3, d: '4' };
    const server = app.run.bind(app);
    const response = await request(server).post('/test').set('Accept', 'application/json').send(data);
    const body = response.text;
    expect(response.statusCode).to.eq(200);
    expect(response.type).to.eq('application/json');
    expect(body).to.eq(JSON.stringify(data));
  });
});
