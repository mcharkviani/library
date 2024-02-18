import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BookService } from './book.service';
import { BookDetailsEntity, BookEntity } from './entities';
import { Auth } from '../../common';
import {
  CreateBookDto,
  CreateBookPageDto,
  FilterBooksDto,
  GetBookPageDto,
  UpdateBookDto,
  UpdateBookPageDto,
} from './dto';

@ApiTags('books')
@Controller('books')
@Auth()
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @ApiOperation({ summary: 'Get books' })
  @Get()
  async getBooks(@Query() dto: FilterBooksDto): Promise<{ data: BookEntity[]; total: number }> {
    return this.bookService.getBooks(dto);
  }

  @ApiOperation({ summary: 'Get book page by book id and page id' })
  @Get('page')
  async getBookPageB(@Query() dto: GetBookPageDto): Promise<BookDetailsEntity> {
    return this.bookService.getBookPage(dto.bookId, dto.page);
  }

  @ApiOperation({ summary: 'Get book by id' })
  @Get(':id')
  async getBookById(@Param('id', ParseUUIDPipe) id: string): Promise<BookEntity> {
    return this.bookService.getBookById(id);
  }

  @ApiOperation({ summary: 'Create book' })
  @Post()
  async createBook(@Body() body: CreateBookDto): Promise<BookEntity> {
    return this.bookService.createBook(body);
  }

  @ApiOperation({ summary: 'Create book' })
  @Put(':id')
  async updateBook(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateBookDto): Promise<BookEntity> {
    return this.bookService.updateBook(id, body);
  }

  @ApiOperation({ summary: 'Create a page for book' })
  @Post('page')
  async createBookPage(@Body() body: CreateBookPageDto): Promise<BookDetailsEntity> {
    return this.bookService.createBookPage(body);
  }

  @ApiOperation({ summary: 'Create book' })
  @Put('page/:id')
  async updateBookPage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBookPageDto,
  ): Promise<BookDetailsEntity> {
    return this.bookService.updateBookPage(id, body);
  }

  @ApiOperation({ summary: 'Delete book page' })
  @Delete('page/:id')
  async deleteBookPage(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.bookService.deleteBookPage(id);
  }

  @ApiOperation({ summary: 'Delete book' })
  @Delete(':id')
  async deleteBook(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.bookService.deleteBook(id);
  }
}
