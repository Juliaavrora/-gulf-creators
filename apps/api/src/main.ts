import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Единый .env.local в корне репозитория (см. .env.example).
const rootEnv = resolve(__dirname, '../../../.env.local');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

async function bootstrap() {
  // Вход «как тестовый пользователь» запрещён в проде. Исключение — демо-стенд (DEMO_MODE=true):
  // только тестовые данные, без настоящих пользователей и денег.
  if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH === 'true' && process.env.DEMO_MODE !== 'true') {
    throw new Error('DEV_AUTH must not be enabled in production');
  }
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    allowedHeaders: ['content-type', 'x-dev-user'],
    methods: ['GET', 'POST'],
  });
  // PORT задаёт хостинг (Railway), API_PORT — локальная разработка.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
