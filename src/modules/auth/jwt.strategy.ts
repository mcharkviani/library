import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../users/user.service';
import { UserEntity } from '../users/entities';
import { ErrorMessage } from '../../common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    };

    super(strategyOptions);
  }

  async validate(payload: { userId: string; iat: number; exp: number }): Promise<{ data: UserEntity }> {
    const user: UserEntity = await this.userService.verifyUser(payload.userId);

    if (!user) {
      throw new UnauthorizedException(ErrorMessage.Unauthorized);
    }

    return { data: user };
  }
}
