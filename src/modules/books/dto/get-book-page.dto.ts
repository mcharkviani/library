import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { PageOptionsDto } from '../../../common';

export class GetBookPageDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(1)
  page: number;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}

export class FilterBooksDto extends PageOptionsDto {}
