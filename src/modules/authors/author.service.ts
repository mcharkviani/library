import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AuthorEntity } from './entities';
import { ErrorMessage } from '../../common';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';

@Injectable()
export class AuthorService {
  @InjectRepository(AuthorEntity)
  private readonly authorRepository: Repository<AuthorEntity>;

  async validateAuthorById(id: string): Promise<void> {
    const authorExists: number = await this.authorRepository.count({ where: { id } });

    if (!authorExists) {
      throw new NotFoundException(ErrorMessage.AUTHOR_NOT_FOUND);
    }
  }

  async getAuthorById(id: string): Promise<AuthorEntity> {
    const foundUser: AuthorEntity = await this.authorRepository.findOne({ where: { id } });

    if (!foundUser) {
      throw new NotFoundException(ErrorMessage.AUTHOR_NOT_FOUND);
    }

    return foundUser;
  }

  async createAuthor(params: CreateAuthorDto): Promise<AuthorEntity> {
    return this.authorRepository.save(params);
  }

  async updateAuthor(id: string, params: UpdateAuthorDto): Promise<AuthorEntity> {
    const user: AuthorEntity = await this.getAuthorById(id);

    return this.authorRepository.save({
      ...user,
      ...params,
    });
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.validateAuthorById(id);
    await this.authorRepository.softDelete(id);
  }
}
