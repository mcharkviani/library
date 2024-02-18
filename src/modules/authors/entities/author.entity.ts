import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common';
import { BookEntity } from '../../books/entities';

@Entity({ name: 'authors' })
export class AuthorEntity extends AbstractEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @OneToMany(() => BookEntity, (book: BookEntity) => book.author)
  books?: BookEntity[];
}
