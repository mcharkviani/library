import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ErrorMessage, validatePassword } from '../../common';
import { UserEntity } from '../users/entities';
import { SignInUserDto } from './dto';
import { UserService } from '../users/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async signIn(params: SignInUserDto): Promise<{ accessToken: string; user: UserEntity }> {
    const { email, password } = params;

    const user: UserEntity = await this.userService.getUserByEmail(email);

    if (user && (await validatePassword(password, user.salt, user.password))) {
      const accessToken: string = await this.jwtService.signAsync({ userId: user.id });

      delete user.password;
      delete user.salt;

      return { accessToken, user };
    }

    throw new BadRequestException(ErrorMessage.INVALID_CREDENTIALS);
  }
}
