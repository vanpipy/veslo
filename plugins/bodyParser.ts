import { Middleware } from '../src';

const bodyParser: Middleware = (context, next) => {
  const { req } = context;
  let result = '';
  req.on('data', (chunk) => {
    result += chunk;
  });
  req.on('end', () => {
    const hasJson = req.headers['accept']?.includes('application/json');
    req.body = hasJson ? (JSON.parse(result) as AnyObject) : result;
    next();
  });
};

export default bodyParser;
