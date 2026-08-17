import { Readable } from 'node:stream';
import legacyHandler from './_handler.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const rawBody = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
    const req = Readable.from(rawBody ? [rawBody] : []);
    req.method = request.method;
    req.query = Object.fromEntries(url.searchParams);
    req.headers = Object.fromEntries(request.headers.entries());

    let responseBody = '';
    const responseHeaders = new Headers();
    const res = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders.set(name, value);
      },
      end(value = '') {
        responseBody = String(value);
      },
    };

    await legacyHandler(req, res);
    return new Response(responseBody, {
      status: res.statusCode,
      headers: responseHeaders,
    });
  },
};
