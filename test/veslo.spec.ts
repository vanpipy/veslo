import request from 'supertest';
import { expect } from 'chai';
import Veslo from '../src/Veslo';

describe('Veslo', () => {
  const methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];
  const app = new Veslo();
  let i = 0;

  it('should set the custom attribute for current application', () => {
    app.set('test', 'a test attribute');
    expect(app.get('test')).to.eq('a test attribute');
  });

  it('should overwrite the attribute when set with same key again', () => {
    app.set('test', 'overwrited');
    expect(app.get('test')).to.eq('overwrited');
  });

  it(`should reply \`Hi, I am veslo\` when the route is empty and request with get method`, (done) => {
    const server = app.run.bind(app);
    void request(server)
      .get('/')
      .expect('Content-Type', 'text/plain')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('Hi, I am veslo');

        return done();
      });
  });

  it(`should reply the expected content when hit a get method route`, (done) => {
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
    void request(server)
      .get('/testget')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a head route`, (done) => {
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
    void request(server)
      .head('/testhead')
      .expect(200)
      .end(() => {
        return done();
      });
  });

  it(`should reply the expected content when hit a post method route`, (done) => {
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
    void request(server)
      .post('/testpost')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a put route`, (done) => {
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
    void request(server)
      .put('/testput')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a delete method route`, (done) => {
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
    void request(server)
      .delete('/testdelete')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a connect method route`, (done) => {
    app.route({
      path: '/testconnect',
      method: 'CONNECT',
      stack: [
        ({ res }) => {
          res.end();
        },
      ],
    });

    const server = app.run.bind(app);
    void request(server)
      .connect('/testconnect')
      .expect(200)
      .end(() => {
        return done();
      });
  });

  it(`should reply the expected content when hit a options method route`, (done) => {
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
    void request(server)
      .options('/testoptions')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a trace method route`, (done) => {
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
    void request(server)
      .trace('/testtrace')
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res.text).to.eq('test the route');

        return done();
      });
  });

  it(`should reply the expected content when hit a patch method route`, (done) => {
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
    void request(server)
      .patch('/testpatch')
      .expect(200)
      .end(() => {
        return done();
      });
  });

  it('should invoke the middlewares when request successfully', (done) => {
    app.use((_, next) => {
      i += 1;
      next();
    });

    app.use((_, next) => {
      i += 2;
      next();
    });

    const server = app.run.bind(app);
    void request(server)
      .get('/testget')
      .end((err) => {
        if (err) {
          return done(err);
        }

        expect(i).to.eq(3);

        return done();
      });
  });

  it('should invoke the middlewares when request successfully again', (done) => {
    const server = app.run.bind(app);
    void request(server)
      .get('/testget')
      .end((err) => {
        if (err) {
          return done(err);
        }

        expect(i).to.eq(6);

        return done();
      });
  });
});
