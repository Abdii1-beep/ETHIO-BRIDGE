import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  const prefix = config.get<string>('API_PREFIX') ?? 'api/v1';
  app.setGlobalPrefix(prefix, { exclude: ['health'] });

  // Increase body-parser limit to handle large base64 images
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });
  
  // Set body-parser limits for large payloads (base64 images)
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:3003')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  const port = Number(config.get<string>('PORT') ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`ETHIO-BRIDGE API listening on port ${port}/${prefix}`);
}

void bootstrap();