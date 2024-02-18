import { DocumentBuilder } from '@nestjs/swagger';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';

export const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
  .setTitle('Library API')
  .setVersion('1.0')
  .addTag('Library api')
  .addBearerAuth()
  .build();
