import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

import { AppModule } from '../src/app.module';
import { createAuthor, createBook, createBookPage, createUser } from './helper';
import { AuthorEntity } from '../src/modules/authors/entities';
import { ErrorMessage } from '../src/common';
import { bookPageStubData, bookStubData, bookWithDetailsStubData, newUniqueIsbn } from './helper/stubs';
import { BookDetailsEntity, BookEntity } from '../src/modules/books/entities';

describe('Book module (e2e)', (): void => {
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
    await entityManager.getRepository(BookEntity).delete({});
    await entityManager.getRepository(AuthorEntity).delete({});
    await entityManager.getRepository(BookDetailsEntity).delete({});
    jest.clearAllMocks();
  });

  describe('Book Controller e2e', (): void => {
    describe('POST /books', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'title must be a string',
          'title should not be empty',
          'isbn must be a string',
          'isbn should not be empty',
          'totalPages must not be less than 1',
          'totalPages must be a number conforming to the specified constraints',
          'totalPages should not be empty',
          'authorId must be a UUID',
          'authorId must be a string',
          'authorId should not be empty',
        ]);
      });

      it('throw error if book author not found', async (): Promise<void> => {
        await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookStubData, isbn: newUniqueIsbn, authorId: uuidv4() });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.AUTHOR_NOT_FOUND);
      });

      it('throw error if isbn already exists', async (): Promise<void> => {
        const author: AuthorEntity = await createAuthor({ entityManager });
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookStubData, isbn: createdBook.isbn, authorId: author.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.ISBN_ALREADY_EXISTS);
      });

      it('throw error if given pages are duplicated', async (): Promise<void> => {
        const author: AuthorEntity = await createAuthor({ entityManager });
        const duplicateBookData = JSON.parse(JSON.stringify(bookWithDetailsStubData));
        duplicateBookData.bookDetails.push({ page: 1, content: 'Duplicated page' });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...duplicateBookData, isbn: newUniqueIsbn, authorId: author.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.PAGES_MUST_BE_UNIQUE);
      });

      it('throw error if given page number exceeds total pages', async (): Promise<void> => {
        const author: AuthorEntity = await createAuthor({ entityManager });
        const duplicateBookData = JSON.parse(JSON.stringify(bookWithDetailsStubData));
        duplicateBookData.bookDetails.push({ page: 1000, content: 'Page index is invalid here' });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...duplicateBookData, isbn: newUniqueIsbn, authorId: author.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.PAGE_EXCEEDS);
      });

      it('create book successfully', async (): Promise<void> => {
        const author: AuthorEntity = await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookStubData, isbn: newUniqueIsbn, authorId: author.id });

        expect(response.status).toBe(201);
        expect(response.body.title).toEqual(bookStubData.title);
        expect(response.body.isbn).toEqual(newUniqueIsbn);
        expect(response.body.authorId).toEqual(author.id);

        const foundBook: BookEntity = await entityManager.getRepository(BookEntity).findOneBy({ id: response.body.id });
        expect(foundBook).toBeDefined();
      });

      it('create book with details successfully', async (): Promise<void> => {
        const author: AuthorEntity = await createAuthor({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookWithDetailsStubData, isbn: newUniqueIsbn, authorId: author.id });

        expect(response.status).toBe(201);
        expect(response.body.title).toEqual(bookStubData.title);
        expect(response.body.isbn).toEqual(newUniqueIsbn);
        expect(response.body.authorId).toEqual(author.id);

        const foundBook: BookEntity = await entityManager.getRepository(BookEntity).findOneBy({ id: response.body.id });
        expect(foundBook).toBeDefined();

        const foundBookDetails: BookDetailsEntity[] = await entityManager
          .getRepository(BookDetailsEntity)
          .find({ where: { bookId: response.body.id }, select: ['page', 'content'] });

        expect(foundBookDetails).toEqual(bookWithDetailsStubData.bookDetails);
      });
    });

    describe('POST /books/page', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/books/page`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(400);
        expect(response.body.message).toEqual([
          'bookId must be a UUID',
          'bookId must be a string',
          'bookId should not be empty',
          'content must be a string',
          'content should not be empty',
          'page must not be less than 1',
          'page must be a number conforming to the specified constraints',
          'page should not be empty',
        ]);
      });

      it('throw error if book not found', async (): Promise<void> => {
        const response: request.Response = await request(app.getHttpServer())
          .post(`/books/page`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookPageStubData, bookId: uuidv4() });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('throw error if given page index exceeds total page', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books/page`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookPageStubData, page: 1000, bookId: createdBook.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.PAGE_EXCEEDS);
      });

      it('throw error if given page already exists', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });
        const createdBookPage: BookDetailsEntity = await createBookPage({
          entityManager,
          createBookPageDto: { bookId: createdBook.id },
        });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books/page`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookPageStubData, page: createdBookPage.page, bookId: createdBook.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.PAGES_MUST_BE_UNIQUE);
      });

      it('create book page successfully', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .post(`/books/page`)
          .auth(accessToken, { type: 'bearer' })
          .send({ ...bookPageStubData, bookId: createdBook.id });

        expect(response.status).toBe(201);
        expect(response.body.content).toEqual(bookPageStubData.content);
        expect(response.body.page).toEqual(bookPageStubData.page);
        expect(response.body.bookId).toEqual(createdBook.id);

        const foundBookPage: BookDetailsEntity = await entityManager
          .getRepository(BookDetailsEntity)
          .findOneBy({ id: response.body.id });
        expect(foundBookPage).toBeDefined();
      });
    });

    describe('PUT /books/:id', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
      });

      it('throw error when book does not exist', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('throw error when book author does not exist', async (): Promise<void> => {
        await createAuthor({ entityManager });
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ authorId: uuidv4() });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.AUTHOR_NOT_FOUND);
      });

      it('throw error when book with given isbn already exists', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });
        const createdAnotherBook: BookEntity = await createBook({
          entityManager,
          createBookDto: { isbn: newUniqueIsbn },
        });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ isbn: createdAnotherBook.isbn });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorMessage.ISBN_ALREADY_EXISTS);
      });

      it('update book successfully', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });
        const title: string = "Harry Potter and the Philosopher's Stone";

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ title });

        expect(response.status).toBe(200);
        expect(response.body.title).toEqual(title);

        const foundBook: BookEntity = await entityManager.getRepository(BookEntity).findOneBy({ id: createdBook.id });
        expect(title).toEqual(foundBook.title);
      });
    });

    describe('PUT /books/page/:id', (): void => {
      it('check all required and optional params', async (): Promise<void> => {
        const createdBookPage: BookDetailsEntity = await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/page/${createdBookPage.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
      });

      it('throw error when book page does not exist', async (): Promise<void> => {
        await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/page/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.BOOK_PAGE_NOT_FOUND);
      });

      it('throw error when page owner book does not exist', async (): Promise<void> => {
        await createBook({ entityManager, createBookDto: { isbn: newUniqueIsbn } });
        const createdBookPage: BookDetailsEntity = await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/${createdBookPage.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ bookId: uuidv4() });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('update book page successfully', async (): Promise<void> => {
        const createdBookPage: BookDetailsEntity = await createBookPage({ entityManager });
        const content: string = 'New amazing content';

        const response: request.Response = await request(app.getHttpServer())
          .put(`/books/page/${createdBookPage.id}`)
          .auth(accessToken, { type: 'bearer' })
          .send({ content });

        expect(response.status).toBe(200);
        expect(response.body.content).toEqual(content);

        const foundBookPage: BookDetailsEntity = await entityManager
          .getRepository(BookDetailsEntity)
          .findOneBy({ id: createdBookPage.id });
        expect(content).toEqual(foundBookPage.content);
      });
    });

    describe('GET /books', (): void => {
      it('get books', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/books`)
          .auth(accessToken, { type: 'bearer' })
          .query({
            limit: 10,
            page: 1,
          });

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.total).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /books/:id', (): void => {
      it('book not found', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/books/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
        expect(response.body.message).toEqual(ErrorMessage.BOOK_NOT_FOUND);
      });

      it('get book by id', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(createdBook.id);
      });
    });

    describe('GET /books/page', (): void => {
      it('book page not found', async (): Promise<void> => {
        await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get('/books/page')
          .auth(accessToken, { type: 'bearer' })
          .query({
            bookId: uuidv4(),
            page: 1,
          });

        expect(response.status).toBe(404);
        expect(response.body.message).toEqual(ErrorMessage.BOOK_PAGE_NOT_FOUND);
      });

      it('get book page by id', async (): Promise<void> => {
        const createdBookPage: BookDetailsEntity = await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .get(`/books/page`)
          .auth(accessToken, { type: 'bearer' })
          .query({
            bookId: createdBookPage.bookId,
            page: 1,
          });

        expect(response.status).toBe(200);
        expect(response.body.id).toEqual(createdBookPage.id);
      });
    });

    describe('DELETE /books/:id', (): void => {
      it('when book id is not found while deleting book', async (): Promise<void> => {
        await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/books/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
      });

      it('delete book by id successfully', async (): Promise<void> => {
        const createdBook: BookEntity = await createBook({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/books/${createdBook.id}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /books/page/:id', (): void => {
      it('when book details id is not found while deleting page', async (): Promise<void> => {
        await createBookPage({ entityManager });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/books/page/${uuidv4()}`)
          .auth(accessToken, { type: 'bearer' });

        expect(response.status).toBe(404);
      });

      it('delete book page by id successfully', async (): Promise<void> => {
        const createdBookPage: BookDetailsEntity = await createBookPage({
          entityManager,
        });

        const response: request.Response = await request(app.getHttpServer())
          .delete(`/books/page/${createdBookPage.id}`)
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
