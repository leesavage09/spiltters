import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Splitters API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = join(__dirname, '..', '..', '..', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outputPath}`);
  await app.close();
  process.exit(0);
}

void generate();
