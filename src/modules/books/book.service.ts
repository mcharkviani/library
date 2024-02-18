import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository, Like, MoreThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BookDetailsEntity, BookEntity } from './entities';
import {
  CreateBookDetailsDto,
  CreateBookDto,
  CreateBookPageDto,
  FilterBooksDto,
  UpdateBookDto,
  UpdateBookPageDto,
} from './dto';
import { AuthorService } from '../authors/author.service';
import { ErrorMessage } from '../../common';

@Injectable()
export class BookService {
  @InjectRepository(BookEntity)
  private readonly bookRepository: Repository<BookEntity>;
  @InjectRepository(BookDetailsEntity)
  private readonly bookDetailsRepository: Repository<BookDetailsEntity>;

  constructor(
    private readonly entityManager: EntityManager,
    private readonly authorService: AuthorService,
  ) {}

  async createBook(params: CreateBookDto): Promise<BookEntity> {
    return this.entityManager.transaction(async (manager: EntityManager): Promise<BookEntity> => {
      const { bookDetails, ...bookParams } = params;

      await this.authorService.validateAuthorById(bookParams.authorId);
      await this.checkIsbn(bookParams.isbn);

      if (bookDetails?.length) {
        const uniquePages = new Set([...bookDetails.map((b: CreateBookDetailsDto) => b.page)]);

        if (bookDetails.length !== uniquePages.size) {
          throw new BadRequestException(ErrorMessage.PAGES_MUST_BE_UNIQUE);
        }

        if (Array.from(uniquePages).some((e: number) => e > params.totalPages)) {
          throw new BadRequestException(ErrorMessage.PAGE_EXCEEDS);
        }
      }

      const createBook: BookEntity = await manager.getRepository(BookEntity).save(bookParams);

      const detailsToCreate = bookDetails?.map((details: CreateBookDetailsDto) => ({
        ...details,
        bookId: createBook.id,
      }));

      if (detailsToCreate?.length) {
        await manager.getRepository(BookDetailsEntity).save(detailsToCreate);
      }

      return createBook;
    });
  }

  async getBooks(dto: FilterBooksDto): Promise<{ data: BookEntity[]; total: number }> {
    const { page, limit, search } = dto;
    let where = {};

    if (search) {
      where = [{ title: Like(`%${search}%`) }, { isbn: Like(`%${search}%`) }];
    }

    const [data, total] = await this.bookRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async updateBook(id: string, params: UpdateBookDto): Promise<BookEntity> {
    const { authorId, isbn } = params;
    const foundBook: BookEntity = await this.getBookById(id);

    if (authorId && authorId !== foundBook.authorId) {
      await this.authorService.validateAuthorById(params.authorId);
    }

    if (isbn && isbn !== foundBook.isbn) {
      await this.checkIsbn(isbn);
    }

    return this.bookRepository.save({
      id,
      ...params,
    });
  }

  async createBookPage(params: CreateBookPageDto): Promise<BookDetailsEntity> {
    const { bookId, page } = params;

    const book: BookEntity = await this.getBookById(bookId);

    if (page > book.totalPages) {
      throw new BadRequestException(ErrorMessage.PAGE_EXCEEDS);
    }

    const bookPageExists: number = await this.bookDetailsRepository.count({ where: { bookId, page } });

    if (bookPageExists) {
      throw new BadRequestException(ErrorMessage.PAGES_MUST_BE_UNIQUE);
    }

    return this.bookDetailsRepository.save(params);
  }

  async updateBookPage(id: string, params: UpdateBookPageDto): Promise<BookDetailsEntity> {
    const { content } = params;

    const bookPageExists: number = await this.bookDetailsRepository.count({ where: { id } });

    if (!bookPageExists) {
      throw new NotFoundException(ErrorMessage.BOOK_PAGE_NOT_FOUND);
    }

    return this.bookDetailsRepository.save({ id, content });
  }

  async checkIsbn(isbn: string): Promise<void> {
    const isbnExists: number = await this.bookRepository.count({ where: { isbn } });

    if (isbnExists) {
      throw new BadRequestException(ErrorMessage.ISBN_ALREADY_EXISTS);
    }
  }

  async getBookById(id: string): Promise<BookEntity> {
    const book: BookEntity = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException(ErrorMessage.BOOK_NOT_FOUND);
    }

    return book;
  }

  async getBookPage(bookId: string, page: number): Promise<BookDetailsEntity> {
    const bookPage: BookDetailsEntity = await this.bookDetailsRepository.findOne({ where: { bookId, page } });

    if (!bookPage) {
      throw new NotFoundException(ErrorMessage.BOOK_PAGE_NOT_FOUND);
    }

    return bookPage;
  }

  async deleteBook(id: string): Promise<void> {
    await this.validateBookById(id);
    await this.bookRepository.softDelete(id);
  }

  async validateBookById(id: string): Promise<void> {
    const bookExists: number = await this.bookRepository.count({ where: { id } });

    if (!bookExists) {
      throw new NotFoundException(ErrorMessage.BOOK_NOT_FOUND);
    }
  }

  async deleteBookPage(id: string): Promise<void> {
    await this.validateBookPageById(id);
    await this.bookDetailsRepository.softDelete(id);
  }

  async validateBookPageById(id: string): Promise<void> {
    const bookPageExists: number = await this.bookDetailsRepository.count({ where: { id } });

    if (!bookPageExists) {
      throw new NotFoundException(ErrorMessage.BOOK_PAGE_NOT_FOUND);
    }
  }

  async getMinBookPage(bookId: string): Promise<number> {
    await this.validateBookById(bookId);

    const bookPage: number = await this.bookDetailsRepository.minimum('page', {
      bookId,
    });

    if (!bookPage) {
      throw new BadRequestException(ErrorMessage.BOOK_HAS_NO_PAGES);
    }

    return bookPage;
  }

  async getCurrentAndNextPages(bookId: string, page: number): Promise<BookDetailsEntity[]> {
    const pages: BookDetailsEntity[] = await this.bookDetailsRepository.find({
      where: { bookId, page: MoreThanOrEqual(page) },
      select: ['page', 'content'],
      take: 2,
      order: { page: 'ASC' },
    });

    return pages;
  }
}
