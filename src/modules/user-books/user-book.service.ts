import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserBookEntity } from './entities';
import { BookService } from '../books/book.service';
import { BookDetailsEntity } from '../books/entities';

@Injectable()
export class UserBookService {
  @InjectRepository(UserBookEntity)
  private readonly userBookRepository: Repository<UserBookEntity>;

  constructor(private readonly bookService: BookService) {}

  async saveUserBook(userId: string, bookId: string): Promise<UserBookEntity> {
    const minPage: number = await this.bookService.getMinBookPage(bookId);

    return this.userBookRepository.save({
      userId,
      bookId,
      lastPageUserLookedAt: minPage,
    });
  }

  async turnPage(
    userId: string,
    bookId: string,
    page?: number,
  ): Promise<{
    currentPage: { page: number; content: string };
    nexPage?: number;
  }> {
    await this.bookService.validateBookById(bookId);

    const userBook: UserBookEntity = await this.userBookRepository.findOne({
      where: {
        userId,
        bookId,
      },
    });

    const pages: BookDetailsEntity[] = await this.bookService.getCurrentAndNextPages(
      bookId,
      page ?? userBook.lastPageUserLookedAt,
    );

    if (page) {
      await this.userBookRepository.update(
        { bookId: userBook.bookId, userId: userBook.userId },
        { lastPageUserLookedAt: pages[0].page },
      );
    }

    return {
      currentPage: {
        page: pages[0]?.page,
        content: pages[0]?.content,
      },
      nextPage: null,
      ...(pages.length > 1 && { nextPage: pages[1].page }),
    };
  }
}
