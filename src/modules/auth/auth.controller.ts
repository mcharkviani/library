import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { RegisterUserDto, SignInUserDto } from './dto';
import { UserEntity } from '../users/entities';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Register user' })
  @Post('register')
  async register(@Body() data: RegisterUserDto): Promise<{ statusCode: number; message: string }> {
    return this.userService.register(data);
  }

  @ApiOperation({ summary: 'Sign in' })
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() data: SignInUserDto): Promise<{ accessToken: string; user: UserEntity }> {
    return this.authService.signIn(data);
  }
}
