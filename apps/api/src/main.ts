import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Единый .env.local в корне репозитория (см. .env.example).
const rootEnv = resolve(__dirname, '../../../.env.local');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH === 'true') {
    throw new Error('DEV_AUTH must not be enabled in production');
  }
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
