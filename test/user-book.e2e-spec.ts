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
import { createBook, createBookPage, createUser, creatUserBook } from './helper';
import { ErrorMessage } from '../src/common';
import { BookDetailsEntity, BookEntity } from '../src/modules/books/entities';
import { UserBookEntity } from '../src/modules/user-books/entities';
import { UserEntity } from '../src/modules/users/entities';

describe('User book module (e2e)', (): void => {
  let app: INestApplication;
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let entityManager: EntityManager;
  let jwtService: JwtService;
  let accessToken: string;
  let createdUser: UserEntity;

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

    createdUser = await createUser({ entityManager });
    jwtService = app.get<JwtService>(JwtService);
    accessToken = await jwtService.signAsync({ userId: createdUser.id });
  });

  afterEach(async (): Promise<void> => {
    await entityManager.getRepository(UserBookEntity).delete({});
    await entityManager.getRepository(BookDetailsEntity).delete({});
    await entityManager.getRepository(BookEntity).delete({});
    await entityManager.getRepository(AuthorEntity).delete({});
    jest.clearAllMocks();
  });

  describe('User book Controller e2e', (): void => {
    describe('POST /user-books', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/user-books`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(['bookId should not be empty', 'bookId must be a UUID']);
      });

      it('when book not found', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/user-books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ bookId: uuidv4() });

        expect(response.status).toBe(404);
        expect(response.body.message).toEqual(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('when book has no pages', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/user-books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ bookId: createdBook.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual(ErrorMessage.BOOK_HAS_NO_PAGES);
      });

      it('save book for user successfully', async (): Promise<void> => {
        const createdBookPage = await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/user-books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ bookId: createdBookPage.bookId });

        expect(response.status).toBe(201);
        expect(response.body.bookId).toEqual(createdBookPage.bookId);
        expect(response.body.userId).toEqual(createdUser.id);
        expect(response.body.lastPageUserLookedAt).toEqual(createdBookPage.page);

        const foundUserBook: UserBookEntity = await entityManager
          .getRepository(UserBookEntity)
          .findOneBy({ id: response.body.id });
        expect(foundUserBook).toBeDefined();
      });
    });

    describe('GET /user-books/:bookId', (): void => {
      it('book not found', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/user-books/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.message).toEqual(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('successfully, get last page user looked at ', async (): Promise<void> => {
        const data = await creatUserBook({
          entityManager,
          createUserBookDto: { userId: createdUser.id },
        });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/user-books/${data.userBook.bookId}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.currentPage.page).toEqual(data.userBook.lastPageUserLookedAt);
        expect(response.body.currentPage.content).toEqual(data.createdPage.content);
        expect(response.body.nextPage).toEqual(null);
      });

      it('successfully, get user book details by page ', async (): Promise<void> => {
        const data = await creatUserBook({
          entityManager,
          createUserBookDto: { userId: createdUser.id },
        });

        const page2: BookDetailsEntity = await createBookPage({
          entityManager,
          createBookPageDto: { bookId: data.createdPage.bookId, page: 2, content: 'The second page' },
        });

        await createBookPage({
          entityManager,
          createBookPageDto: { bookId: data.createdPage.bookId, page: 3, content: 'The third page' },
        });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/user-books/${data.userBook.bookId}`)
          .auth(accessToken, { type: 'bearer' })
          .query({ page: page2.page });

        expect(response.status).toBe(200);
        expect(response.body.currentPage.page).toEqual(page2.page);
        expect(response.body.currentPage.content).toEqual(page2.content);
        expect(response.body.nextPage).toEqual(3);

        const foundUserBook: UserBookEntity = await entityManager
          .getRepository(UserBookEntity)
          .findOneBy({ bookId: data.createdPage.bookId, userId: createdUser.id });

        expect(foundUserBook.lastPageUserLookedAt).toEqual(page2.page);
      });
    });
  });

  afterAll(async (): Promise<void> => {
    await postgreSqlContainer.stop();
    await app.close();
    jest.clearAllMocks();
  });
});
