import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { environment } from './config/enviroment';
import 'reflect-metadata';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true, bodyParser: false });
  app.use('/reservations-payment/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json()); 
  app.use(express.urlencoded({ extended: true }));
  
  app.enableCors({
    origin: environment.FRONTEND_URL,
  });

  const config = new DocumentBuilder()
    .setTitle('GastroFlow API')
    .setDescription('API for restaurant management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
}
bootstrap();
