import { AuthorEntity } from '../../../src/modules/authors/entities';

export const authorStubData: Partial<AuthorEntity> = {
  firstName: 'Joanne',
  lastName: 'Rowling',
  dateOfBirth: new Date('1965-07-31'),
};
