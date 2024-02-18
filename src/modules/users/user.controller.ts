import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';
import { UserEntity } from './entities';
import { Auth, AuthUser } from '../../common';

@ApiTags('users')
@Controller('users')
@Auth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get logged in user profile' })
  @Get('profile')
  async profile(@AuthUser() authUser: UserEntity): Promise<UserEntity> {
    return this.userService.getUserById(authUser['data'].id);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @Get(':id')
  async getBookById(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
    return this.userService.getUserById(id);
  }
}
