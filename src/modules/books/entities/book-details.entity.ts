import { Column, Entity, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common';
import { BookEntity } from './';

@Entity({ name: 'book_details' })
export class BookDetailsEntity extends AbstractEntity {
  @Column({ type: 'text' })
  content: string;

  @Column()
  page: number;

  @Column()
  bookId: string;

  @ManyToOne(() => BookEntity, (book: BookEntity) => book.bookDetails, {
    onDelete: 'CASCADE',
  })
  book?: BookEntity;
}
