/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import { expect } from 'chai';
import Veslo from '../src/Veslo';

// `setTimeout` creates a macro task and the the task can wait any macro or micro task finished.
const wait = (delay = 1) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(0);
    }, delay);
  });

describe('Veslo', () => {
  let app: Veslo;

  beforeEach(() => {
    app = new Veslo({ logger: { level: 'debug' } });
  });

  it('should set the custom attribute for current application', () => {
    app.set('test', 'a test attribute');
    expect(app.get('test')).to.eq('a test attribute');
  });

  it('should overwrite the attribute when set with same key again', () => {
    app.set('test', 'overwrited');
    expect(app.get('test')).to.eq('overwrited');
  });

  it(`should reply \`Hi, I am veslo\` when request root path with get method`, async () => {
    const server = app.run.bind(app);
    const response = await request(server).get('/');
    expect(response.statusCode).to.eq(200);
    expect(response.headers['content-type']).to.eq('text/plain');
    expect(response.text).to.eq('Hi, I am veslo');
  });

  it(`should reply the expected content when hit a get method route`, async () => {
    app.route({
      path: '/testget',
      method: 'GET',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).get('/testget');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a head route`, async () => {
    app.route({
      path: '/testhead',
      method: 'HEAD',
      stack: [
        ({ res }) => {
          res.end();
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).head('/testhead');
    expect(response.statusCode).to.eq(200);
  });

  it(`should reply the expected content when hit a post method route`, async () => {
    app.route({
      path: '/testpost',
      method: 'POST',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).post('/testpost');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a put route`, async () => {
    app.route({
      path: '/testput',
      method: 'PUT',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).put('/testput');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a delete method route`, async () => {
    app.route({
      path: '/testdelete',
      method: 'DELETE',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).delete('/testdelete');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a options method route`, async () => {
    app.route({
      path: '/testoptions',
      method: 'OPTIONS',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).options('/testoptions');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a trace method route`, async () => {
    app.route({
      path: '/testtrace',
      method: 'TRACE',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).trace('/testtrace');
    expect(response.statusCode).to.eq(200);
    expect(response.text).to.eq('test the route');
  });

  it(`should reply the expected content when hit a patch method route`, async () => {
    app.route({
      path: '/testpatch',
      method: 'PATCH',
      stack: [
        ({ res }) => {
          res.end();
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).patch('/testpatch');
    expect(response.statusCode).to.eq(200);
  });

  it('should make the routes work independenttly when the app has multiple routes', async () => {
    app.route({
      path: '/testa',
      method: 'GET',
      stack: [
        ({ res }) => {
          res.end('1');
        },
      ],
    });

    app.route({
      path: '/testa',
      method: 'POST',
      stack: [
        ({ res }) => {
          res.end('3');
        },
      ],
    });

    app.route({
      path: '/testa',
      method: 'PUT',
      stack: [
        ({ res }) => {
          res.end('6');
        },
      ],
    });

    app.route({
      path: '/testb',
      method: 'GET',
      stack: [
        ({ res }) => {
          res.end('10');
        },
      ],
    });

    const server = app.run.bind(app);
    let response = await request(server).get('/testa');
    await wait();
    expect(response.text).to.eq('1');
    response = await request(server).post('/testa');
    await wait();
    expect(response.text).to.eq('3');
    response = await request(server).put('/testa');
    await wait();
    expect(response.text).to.eq('6');
    response = await request(server).get('/testb');
    await wait();
    expect(response.text).to.eq('10');
  });

  it('should invoke the middlewares when request successfully', async () => {
    let i = 0;

    app.route({
      path: '/testmiddleware',
      method: 'GET',
      stack: [
        ({ res }) => {
          res.end('test the route');
        },
      ],
    });

    app.use((_, next) => {
      i += 1;
      return next();
    });

    app.use((_, next) => {
      i += 2;
      return next();
    });

    app.use((_, next) => {
      i += 3;
      return next();
    });

    const server = app.run.bind(app);
    await request(server).get('/testmiddleware');
    await wait();
    expect(i).to.eq(6);
  });

  it('should extract the path onto request.params', async () => {
    app.route({
      path: '/test/:which/:id',
      method: 'GET',
      stack: [
        ({ req, res }) => {
          res
            .writeHead(200, {
              'Content-Type': 'application/json',
            })
            .end(JSON.stringify(req.params));
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).get('/test/a/10');
    expect(response.statusCode).to.eq(200);
    expect(response.headers['content-type']).to.eq('application/json');
    expect(response.text).to.eq(JSON.stringify({ which: 'a', id: '10' }));
  });

  it('should reply 404 code when request a not found path', async () => {
    const server = app.run.bind(app);
    const response = await request(server).get('/notfound');
    expect(response.statusCode).to.eq(404);
    expect(response.headers['content-type']).to.eq('text/html');
    expect(response.text).to.eq('404\n/notfound GET Cannot Found');
  });

  it('should reach 500 code when requesting with an exception in the middleware', async () => {
    app.use(() => {
      throw new Error('middleware error');
    });

    app.route({
      path: '/500',
      method: 'GET',
      stack: [
        () => {
          throw new Error('500 error');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).get('/500');
    expect(response.statusCode).to.eq(500);
    expect(response.headers['content-type']).to.eq('text/html');
    expect(response.text).to.eq('500\nServer Error\nmiddleware error');
  });

  it('should reach 500 code when requesting with an exception in the route', async () => {
    app.route({
      path: '/500',
      method: 'GET',
      stack: [
        () => {
          throw new Error('500 error');
        },
      ],
    });

    const server = app.run.bind(app);
    const response = await request(server).get('/500');
    expect(response.statusCode).to.eq(500);
    expect(response.headers['content-type']).to.eq('text/html');
    expect(response.text).to.eq('500\nServer Error\n500 error');
  });
});
