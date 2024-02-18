import { PartialType } from '@nestjs/swagger';

import { CreateAuthorDto } from './';

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {}
