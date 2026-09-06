import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: any;

async function getApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.init();
  }
  return app;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const nestApp = await getApp();
    const instance = nestApp.getHttpAdapter().getInstance();
    return instance.handle(request);
  },
};
