import { IncomingMessage, ServerResponse } from 'node:http';

class Response<Request extends IncomingMessage = IncomingMessage> extends ServerResponse<Request> {}

export default Response;
