import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';

import { AppModule } from '../src/app.module';
import { createUser } from './helper';
import { defaultPassword, userStubData } from './helper/stubs';
import { ErrorMessage, SuccessMessage } from '../src/common';
import { UserEntity } from '../src/modules/users/entities';

describe('Auth module (e2e)', (): void => {
  let app: INestApplication;
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let entityManager: EntityManager;

  jest.setTimeout(100_000);

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

    await app.init();
    entityManager = appModuleRef.get<EntityManager>(EntityManager);
  });

  afterEach(async (): Promise<void> => {
    await entityManager.getRepository(UserEntity).delete({});
    jest.clearAllMocks();
  });

  describe('Auth Controller e2e', (): void => {
    describe('POST auth/register', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer()).post(`/auth/register`);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'firstName must be a string',
          'firstName should not be empty',
          'lastName must be a string',
          'lastName should not be empty',
          'email must be an email',
          'email should not be empty',
          'password must be longer than or equal to 6 characters',
          'password must be a string',
          'password should not be empty',
        ]);
      });

      it('throw error if emails already exists', async (): Promise<void> => {
        const user = await createUser({ entityManager });
        await createUser({ entityManager, createUserDto: { email: 'test.test@gmail.com' } });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/auth/register`)
          .send({ ...userStubData, password: defaultPassword, email: user.email });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(ErrorMessage.EMAIL_ALREADY_EXISTS);
      });

      it('register user successfully', async (): Promise<void> => {
        await createUser({ entityManager, createUserDto: { email: 'test.test@gmail.com' } });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/auth/register`)
          .send({ ...userStubData, password: defaultPassword, email: 'new.email@gmail.com' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe(SuccessMessage.USER_REGISTERED_SUCCESSFULLY);
      });
    });

    describe('POST /auth/sing-in', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer()).post(`/auth/sign-in`);

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'email must be an email',
          'email should not be empty',
          'password must be longer than or equal to 6 characters',
          'password must be a string',
          'password should not be empty',
        ]);
      });

      it('when user email is invalid', async (): Promise<void> => {
        await createUser({ entityManager, createUserDto: { email: 'test.test@gmail.com' } });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/auth/sign-in`)
          .send({ password: defaultPassword, email: 'invalid.test@gmail.com' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.INVALID_CREDENTIALS);
      });

      it('when user password is invalid', async (): Promise<void> => {
        await createUser({ entityManager, createUserDto: { email: 'test.test@gmail.com' } });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/auth/sign-in`)
          .send({ password: 'SomeInvalidPass123', email: 'test.test@gmail.com' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.INVALID_CREDENTIALS);
      });

      it('when user logged in successfully', async (): Promise<void> => {
        const user = await createUser({ entityManager, createUserDto: { email: 'test.test@gmail.com' } });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/auth/sign-in`)
          .send({ ...userStubData, password: defaultPassword, email: 'test.test@gmail.com' });

        expect(response.status).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.user).toEqual({
          id: user.id,
          email: user.email,
        });
      });
    });
  });

  afterAll(async (): Promise<void> => {
    await postgreSqlContainer.stop();
    await app.close();
    jest.clearAllMocks();
  });
});
