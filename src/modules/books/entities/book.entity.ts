import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common';
import { BookDetailsEntity } from './';
import { AuthorEntity } from '../../authors/entities';

@Entity({ name: 'books' })
export class BookEntity extends AbstractEntity {
  @Column({ unique: true })
  isbn: string;

  @Column()
  title: string;

  @Column()
  totalPages: number;

  @OneToMany(() => BookDetailsEntity, (bookDetails: BookDetailsEntity) => bookDetails.book)
  bookDetails?: BookDetailsEntity[];

  @Column()
  authorId: string;

  @ManyToOne(() => AuthorEntity, (author: AuthorEntity) => author.books, {
    onDelete: 'CASCADE',
  })
  author?: AuthorEntity;
}
