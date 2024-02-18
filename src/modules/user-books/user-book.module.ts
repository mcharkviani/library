import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserBookEntity } from './entities';
import { UserBookService } from './user-book.service';
import { UserBookController } from './user-book.controller';
import { UserModule } from '../users/user.module';
import { BookModule } from '../books/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserBookEntity]), UserModule, BookModule],
  controllers: [UserBookController],
  providers: [UserBookService],
  exports: [UserBookService],
})
export class UserBookModule {}
