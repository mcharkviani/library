import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from './entities';
import { hashPassword, ErrorMessage, SuccessMessage } from '../../common';
import { RegisterUserDto } from '../auth/dto';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  async getUserById(id: string): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } });
  }

  async verifyUser(id: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: {
        id,
      },
      select: ['id', 'email'],
    });
  }

  async register(data: RegisterUserDto): Promise<{ statusCode: number; message: string }> {
    const userExists: UserEntity = await this.userRepository.findOne({
      where: {
        email: data.email,
      },
    });

    if (userExists) {
      throw new HttpException(ErrorMessage.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }

    const { hashedPassword, salt } = await hashPassword(data.password);

    await this.userRepository.save({
      ...data,
      password: hashedPassword,
      salt,
    });

    return {
      statusCode: HttpStatus.OK,
      message: SuccessMessage.USER_REGISTERED_SUCCESSFULLY,
    };
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: {
        email,
      },
      select: ['id', 'email', 'password', 'salt'],
    });
  }

  async validateUserById(id: string): Promise<void> {
    const userExists: number = await this.userRepository.count({ where: { id } });

    if (!userExists) {
      throw new BadRequestException(ErrorMessage.USER_NOT_FOUND);
    }
  }
}
