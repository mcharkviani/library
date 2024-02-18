import { BookDetailsEntity, BookEntity } from '../../../src/modules/books/entities';

export const bookStubData: Partial<BookEntity> = {
  title: 'Harry Potter',
  isbn: '1338878921',
  totalPages: 500,
};

export const bookPageStubData: Partial<BookDetailsEntity> = {
  content: 'Some wonderful text',
  page: 1,
};

export const newUniqueIsbn: string = 'UniqueISBNTest';

export const bookWithDetailsStubData = {
  title: 'Harry Potter',
  isbn: '1338878921',
  totalPages: 500,
  bookDetails: [
    { page: 1, content: 'This is the first amazing page' },
    { page: 2, content: 'This is the second amazing page' },
  ],
};
