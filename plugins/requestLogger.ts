import { Middleware } from '../src/index';

const requestLogger: Middleware = (context, next) => {
  const { req, res } = context;
  const timestamp = new Date().getTime();

  console.log(`[==>] Incoming message from the path ${req.url as string} - ${timestamp}`);

  res.on('finish', () => {
    const finishedTimestamp = new Date().getTime();
    console.log(`[===] Cost - ${finishedTimestamp - timestamp}ms`);
  });

  next();
};

export default requestLogger;
