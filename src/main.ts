import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

async function getApp(env?: Record<string, any>) {
  if (env) {
    Object.assign(process.env, env);
  }
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.init();
  }
  return app;
}

export default {
  async fetch(request: Request, env?: Record<string, any>): Promise<Response> {
    try {
      const nestApp = await getApp(env);
      const instance = nestApp.getHttpAdapter().getInstance();
      return await instance.handle(request);
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
