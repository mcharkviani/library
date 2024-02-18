import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth, AuthUser } from '../../common';
import { UserBookService } from './user-book.service';
import { UserBookEntity } from './entities';
import { CreateUserBookDto } from './dto';
import { UserEntity } from '../users/entities';

@ApiTags('user-books')
@Controller('user-books')
@Auth()
export class UserBookController {
  constructor(private readonly userBookService: UserBookService) {}

  @ApiOperation({ summary: 'Save user book' })
  @Post()
  async createAuthor(@AuthUser() authUser: UserEntity, @Body() body: CreateUserBookDto): Promise<UserBookEntity> {
    return this.userBookService.saveUserBook(authUser['data'].id, body.bookId);
  }

  @ApiOperation({ summary: 'Turn page' })
  @Get(':bookId')
  async turnPage(
    @AuthUser() authUser: UserEntity,
    @Query('page') page: number,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ): Promise<{
    currentPage: { page: number; content: string };
    nexPage?: number;
  }> {
    return this.userBookService.turnPage(authUser['data'].id, bookId, page);
  }
}
