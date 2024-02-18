import { PartialType, PickType } from '@nestjs/swagger';

import { CreateBookDto, CreateBookPageDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}

export class UpdateBookPageDto extends PartialType(PickType(CreateBookPageDto, ['content'] as const)) {}
