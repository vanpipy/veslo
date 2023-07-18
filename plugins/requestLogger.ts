import { Middleware } from '../src/index';

const formatDate = (date: Date) => {
  return (
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ` +
    `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  );
};

const requestLogger: Middleware = (context, next) => {
  const { req, res } = context;
  const incoming = new Date();
  const incomingTimestamp = incoming.getTime();
  const incomingDate = formatDate(incoming);
  console.log('[<=] [%s] [%s] Incoming message', incomingDate, req.url);
  res.on('finish', () => {
    const outgoing = new Date();
    const outgoingTimestamp = outgoing.getTime();
    const outgoingDate = formatDate(outgoing);
    console.log('[=>] [%s] [%s] Time cost: %dms', outgoingDate, req.url, outgoingTimestamp - incomingTimestamp);
  });

  return next();
};

export default requestLogger;
