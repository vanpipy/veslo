import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';

class Request extends IncomingMessage {
  public resolved = false;

  public params!: Record<string, unknown>;

  public header(key: string) {
    return this.headers[key];
  }

  get URL() {
    const { host } = this.headers;
    return new URL(this.url as string, host);
  }
}

export default Request;
