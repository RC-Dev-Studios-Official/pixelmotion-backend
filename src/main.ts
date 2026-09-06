import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';

let app: any;

async function getApp(env?: Record<string, any>) {
  if (env) {
    Object.assign(process.env, env);
  }
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  }
  return app;
}

async function handleExpressRequest(
  expressApp: any,
  request: Request,
): Promise<Response> {
  return new Promise<Response>(async (resolve, reject) => {
    try {
      const url = new URL(request.url);
      const reqPath = url.pathname + url.search;

      const reqBodyBuffer = request.body
        ? Buffer.from(await request.arrayBuffer())
        : null;
      const reqStream = new Readable({
        read() {
          if (reqBodyBuffer) {
            this.push(reqBodyBuffer);
          }
          this.push(null);
        },
      });

      const req = Object.assign(reqStream, {
        url: reqPath,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        rawHeaders: Array.from(request.headers.entries()).flat(),
        httpVersion: '1.1',
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      });

      const resHeaders = new Headers();
      let statusCode = 200;
      let statusMessage = 'OK';
      const chunks: Uint8Array[] = [];

      const res = Object.assign(new EventEmitter(), {
        statusCode: 200,
        statusMessage: 'OK',
        headersSent: false,
        setHeader(name: string, value: any) {
          if (Array.isArray(value)) {
            resHeaders.delete(name);
            for (const val of value) {
              resHeaders.append(name, val);
            }
          } else {
            resHeaders.set(name, String(value));
          }
          return this;
        },
        getHeader(name: string) {
          return resHeaders.get(name);
        },
        getHeaders() {
          return Object.fromEntries(resHeaders.entries());
        },
        removeHeader(name: string) {
          resHeaders.delete(name);
        },
        hasHeader(name: string) {
          return resHeaders.has(name);
        },
        writeHead(code: number, message?: any, headers?: any) {
          statusCode = code;
          if (typeof message === 'string') {
            statusMessage = message;
          } else if (typeof message === 'object') {
            headers = message;
          }
          if (headers) {
            for (const [k, v] of Object.entries(headers)) {
              this.setHeader(k, v);
            }
          }
          this.headersSent = true;
          return this;
        },
        write(chunk: any) {
          if (chunk) {
            chunks.push(
              typeof chunk === 'string' ? Buffer.from(chunk) : chunk,
            );
          }
          return true;
        },
        end(chunk?: any) {
          if (chunk) {
            chunks.push(
              typeof chunk === 'string' ? Buffer.from(chunk) : chunk,
            );
          }
          this.headersSent = true;
          this.emit('finish');

          const responseBody = Buffer.concat(chunks);
          resolve(
            new Response(responseBody, {
              status: statusCode,
              statusText: statusMessage,
              headers: resHeaders,
            }),
          );
          return this;
        },
      });

      expressApp(req, res, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          res.end();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default {
  async fetch(request: Request, env?: Record<string, any>): Promise<Response> {
    try {
      const nestApp = await getApp(env);
      const expressApp = nestApp.getHttpAdapter().getInstance();
      return await handleExpressRequest(expressApp, request);
    } catch (err: any) {
      console.error('Cloudflare Worker Exception:', err);
      return new Response(
        JSON.stringify({
          statusCode: 500,
          error: 'Worker Error',
          message: err?.message || String(err),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
