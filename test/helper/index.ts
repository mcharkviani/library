import { EntityManager } from 'typeorm';

import { UserEntity } from '../../src/modules/users/entities';
import {
  defaultPassword,
  userStubData,
  authorStubData,
  bookStubData,
  bookPageStubData,
  newUniqueIsbn,
  newUniqueEmail,
} from './stubs';
import { hashPassword } from '../../src/common';
import { AuthorEntity } from '../../src/modules/authors/entities';
import { CreateAuthorDto } from '../../src/modules/authors/dto';
import { CreateBookDto, CreateBookPageDto } from '../../src/modules/books/dto';
import { BookDetailsEntity, BookEntity } from '../../src/modules/books/entities';
import { UserBookEntity } from '../../src/modules/user-books/entities';

export const createUser = async (params: {
  entityManager: EntityManager;
  createUserDto?: Partial<UserEntity>;
}): Promise<UserEntity> => {
  const password: string = params?.createUserDto?.password ?? defaultPassword;
  const { hashedPassword, salt } = await hashPassword(password);

  return params.entityManager.getRepository(UserEntity).save({
    ...userStubData,
    ...params.createUserDto,
    salt,
    password: hashedPassword,
  });
};

export const createAuthor = async (params: {
  entityManager: EntityManager;
  createAuthorDto?: CreateAuthorDto;
}): Promise<AuthorEntity> => {
  return params.entityManager.getRepository(AuthorEntity).save({
    ...authorStubData,
    ...params.createAuthorDto,
  });
};

export const createBook = async (params: {
  entityManager: EntityManager;
  createBookDto?: Partial<CreateBookDto>;
}): Promise<BookEntity> => {
  const { entityManager, createBookDto } = params;
  const authorId: string =
    createBookDto?.authorId ?? (await createAuthor({ entityManager }).then((res: AuthorEntity) => res.id));

  return params.entityManager.getRepository(BookEntity).save({
    ...bookStubData,
    ...params.createBookDto,
    authorId,
  });
};

export const createBookPage = async (params: {
  entityManager: EntityManager;
  createBookPageDto?: Partial<CreateBookPageDto>;
}): Promise<BookDetailsEntity> => {
  const { entityManager, createBookPageDto } = params;
  const bookId: string =
    createBookPageDto?.bookId ?? (await createBook({ entityManager }).then((res: BookEntity) => res.id));

  return params.entityManager.getRepository(BookDetailsEntity).save({
    ...bookPageStubData,
    ...params.createBookPageDto,
    bookId,
  });
};

export const creatUserBook = async (params: {
  entityManager: EntityManager;
  createUserBookDto?: {
    userId?: string;
    bookId?: string;
  };
}): Promise<{ createdPage: BookDetailsEntity; userBook: UserBookEntity }> => {
  const { entityManager, createUserBookDto } = params;

  const bookId: string =
    createUserBookDto?.bookId ??
    (await createBook({ entityManager, createBookDto: { isbn: newUniqueIsbn } }).then((res: BookEntity) => res.id));

  const createdPage: BookDetailsEntity = await createBookPage({
    entityManager,
    createBookPageDto: { bookId, page: 1, content: 'Some text' },
  });

  const userId: string =
    createUserBookDto?.userId ??
    (await createUser({ entityManager, createUserDto: { email: newUniqueEmail } }).then((res: UserEntity) => res.id));

  const userBook: UserBookEntity = await params.entityManager.getRepository(UserBookEntity).save({
    bookId,
    userId,
    lastPageUserLookedAt: createdPage.page,
  });

  return {
    createdPage,
    userBook,
  };
};
