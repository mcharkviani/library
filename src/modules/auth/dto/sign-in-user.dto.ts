import { PickType } from '@nestjs/swagger';

import { RegisterUserDto } from './';

export class SignInUserDto extends PickType(RegisterUserDto, ['email', 'password'] as const) {}
