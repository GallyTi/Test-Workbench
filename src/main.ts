import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Globálna validácia DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS podpora pre web/mobile klientov
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger API Dokumentácia
  const config = new DocumentBuilder()
    .setTitle('RITS Test & Architecture Graph Workbench API')
    .setDescription(
      'Enterprise platforma pre správu testov, exekúciu testovacích behov, meranie SLA, import z Excelu a prepojenie s grafovou architektúrou.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 API server beží na: http://localhost:${port}`);
  logger.log(`📖 Swagger API dokumentácia dostupná na: http://localhost:${port}/api/docs`);
}

bootstrap();
