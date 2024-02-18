import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookDetailsEntity, BookEntity } from './entities';
import { AuthorModule } from '../authors/author.module';

@Module({
  imports: [TypeOrmModule.forFeature([BookEntity, BookDetailsEntity]), AuthorModule],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
