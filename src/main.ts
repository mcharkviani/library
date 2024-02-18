import { NestApplication, NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';
import helmet from 'helmet';

import { swaggerConfig, loggerMiddleware } from './common';
import { AppModule } from './app.module';

(async function bootstrap(): Promise<void> {
  const logger: Logger = new Logger('bootstrap');

  const app: NestApplication = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const document: OpenAPIObject = SwaggerModule.createDocument(app, swaggerConfig);
  app.use(loggerMiddleware);
  SwaggerModule.setup('api', app, document);

  const HTTP_PORT: number = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(HTTP_PORT);

  const apiUrl: string = await app.getUrl();

  logger.verbose(`App listening on port ${HTTP_PORT}`);
  logger.verbose(`Library api docs on --- ${apiUrl}/api`);
})();
