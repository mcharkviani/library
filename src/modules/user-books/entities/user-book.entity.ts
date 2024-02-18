import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from '../../users/entities';
import { BookEntity } from '../../books/entities';
import { AbstractEntity } from '../../../common';

@Entity({ name: 'user_books' })
export class UserBookEntity extends AbstractEntity {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  bookId: string;

  @Column()
  lastPageUserLookedAt: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => BookEntity)
  @JoinColumn({ name: 'book_id' })
  book: BookEntity;
}
