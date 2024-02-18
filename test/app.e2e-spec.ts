import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';
import { swaggerConfig } from '../src/common';

describe('App module (e2e)', (): void => {
  let app: INestApplication;
  let postgreSqlContainer: StartedPostgreSqlContainer;

  jest.setTimeout(130_000);

  beforeAll(async (): Promise<void> => {
    postgreSqlContainer = await new PostgreSqlContainer().start();

    const appEnvs: {
      [key: string]: string | number;
    } = {
      POSTGRES_HOST: postgreSqlContainer.getHost(),
      POSTGRES_PORT: postgreSqlContainer.getPort(),
      POSTGRES_DB: postgreSqlContainer.getDatabase(),
      POSTGRES_USER: postgreSqlContainer.getUsername(),
      POSTGRES_PASSWORD: postgreSqlContainer.getPassword(),
      JWT_SECRET: 'TestSecretKey',
      JWT_EXPIRES: 9000000,
    };

    const appModuleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ConfigModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => appEnvs[key]),
      })
      .compile();

    app = appModuleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    const document: OpenAPIObject = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    await app.init();
  });

  describe('App Controller e2e', (): void => {
    describe('health GET', (): void => {
      it('check database health successfully', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer()).get('/health');

        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.status).toEqual('ok');
        expect(response.body.info.database.status).toEqual('up');
      });

      it('when database is down should return status 503', async (): Promise<void> => {
        await postgreSqlContainer.stop();

        const response: request.Response = await request(app.getHttpServer()).get('/health');

        expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(response.body.status).toEqual('error');
        expect(response.body.error.database.status).toEqual('down');
      });
    });
  });

  afterAll(async (): Promise<void> => {
    await postgreSqlContainer.stop();
    await app.close();
    jest.clearAllMocks();
  });
});
