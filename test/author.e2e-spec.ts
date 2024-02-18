import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../src/app.module';
import { AuthorEntity } from '../src/modules/authors/entities';
import { createAuthor, createUser } from './helper';
import { authorStubData } from './helper/stubs';
import { ErrorMessage } from '../src/common';

describe('Author module (e2e)', (): void => {
  let app: INestApplication;
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let entityManager: EntityManager;
  let jwtService: JwtService;
  let accessToken: string;

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

    const createdUser = await createUser({ entityManager });
    jwtService = app.get<JwtService>(JwtService);
    accessToken = await jwtService.signAsync({ userId: createdUser.id });
  });

  afterEach(async (): Promise<void> => {
    await entityManager.getRepository(AuthorEntity).delete({});
    jest.clearAllMocks();
  });

  describe('Author Controller e2e', (): void => {
    describe('POST /authors', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/authors`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'firstName must be a string',
          'firstName should not be empty',
          'lastName must be a string',
          'lastName should not be empty',
          'dateOfBirth must be a Date instance',
          'dateOfBirth should not be empty',
        ]);
      });

      it('create author successfully', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/authors`)
          .auth(accessToken, { type: 'bearer' })
          .send(authorStubData);

        expect(response.status).toBe(201);
        expect(response.body.firstName).toEqual(authorStubData.firstName);
        expect(response.body.lastName).toEqual(authorStubData.lastName);
        expect(new Date(response.body.dateOfBirth).toString()).toEqual(new Date(authorStubData.dateOfBirth).toString());

        const foundAuthor = await entityManager.getRepository(AuthorEntity).findOneBy({ id: response.body.id });
        expect(foundAuthor).toBeDefined();
      });
    });

    describe('PUT /authors/:id', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const createdAuthor = await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/authors/${createdAuthor.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
      });

      it('throw error when author does not exist', async (): Promise<void> => {
        await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/authors/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.AUTHOR_NOT_FOUND);
      });

      it('when author updated successfully', async (): Promise<void> => {
        const createdAuthor = await createAuthor({ entityManager });
        const firstName = 'J. K.';

        const response: request.Response = await request(app.getHttpServer())
          .put(`/authors/${createdAuthor.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ firstName });

        expect(response.status).toBe(200);
        expect(response.body.firstName).toEqual(firstName);

        const foundAuthor = await entityManager.getRepository(AuthorEntity).findOneBy({ id: createdAuthor.id });
        expect(firstName).toEqual(foundAuthor.firstName);
      });

      describe('GET /authors/:id', (): void => {
        it('author not found', async (): Promise<void> => {
          await createAuthor({ entityManager });

          const response: request.Response = await request(app.getHttpServer())
            .get(`/authors/${uuidv4()}`)
            .auth(accessToken, { type: 'bearer' });

          expect(response.status).toBe(404);
          expect(response.body.message).toEqual(ErrorMessage.AUTHOR_NOT_FOUND);
        });

        it('get author by id', async (): Promise<void> => {
          const createdAuthor = await createAuthor({ entityManager });

          const response: request.Response = await request(app.getHttpServer())
            .get(`/authors/${createdAuthor.id}`)
            .auth(accessToken, { type: 'bearer' });

          expect(response.status).toBe(200);
          expect(response.body.id).toEqual(createdAuthor.id);
        });
      });
    });

    describe('DELETE /authors/:id', (): void => {
      it('when author id is not found while deleting author', async (): Promise<void> => {
        await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/authors/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
      });

      it('delete author by id successfully', async (): Promise<void> => {
        const createdAuthor = await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/authors/${createdAuthor.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
      });
    });
  });

  afterAll(async (): Promise<void> => {
    await postgreSqlContainer.stop();
    await app.close();
    jest.clearAllMocks();
  });
});
