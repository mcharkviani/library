import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common';

@Entity({ name: 'users' })
export class UserEntity extends AbstractEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ select: false })
  salt: string;
}
