import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../common';
import { AuthorService } from './author.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';
import { AuthorEntity } from './entities';

@ApiTags('authors')
@Controller('authors')
@Auth()
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @ApiOperation({ summary: 'Get author by id' })
  @Get(':id')
  async getAuthor(@Param('id', ParseUUIDPipe) id: string): Promise<AuthorEntity> {
    return this.authorService.getAuthorById(id);
  }

  @ApiOperation({ summary: 'Create author' })
  @Post()
  async createAuthor(@Body() body: CreateAuthorDto): Promise<AuthorEntity> {
    return this.authorService.createAuthor(body);
  }

  @ApiOperation({ summary: 'Update author' })
  @Put(':id')
  async updateAuthor(@Body() body: UpdateAuthorDto, @Param('id', ParseUUIDPipe) id: string): Promise<AuthorEntity> {
    return this.authorService.updateAuthor(id, body);
  }

  @ApiOperation({ summary: 'Delete author' })
  @Delete(':id')
  async deleteAuthor(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.authorService.deleteAuthor(id);
  }
}
