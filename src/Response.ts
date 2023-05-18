import { IncomingMessage, ServerResponse } from 'node:http';

class Response<Request extends IncomingMessage = IncomingMessage> extends ServerResponse<Request> {
  header(name: string, value?: string) {
    if (name && value) {
      this.setHeader(name, value);
    } else {
      return this.getHeader(name);
    }
  }

  headers(newHeaders?: Record<string, string | string[]>) {
    if (newHeaders) {
      Object.keys(newHeaders).forEach((name) => {
        this.setHeader(name, newHeaders[name]);
      });
    } else {
      return this.getHeaders();
    }
  }
}

export default Response;
