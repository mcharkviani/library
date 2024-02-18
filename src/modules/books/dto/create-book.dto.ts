import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  isbn: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalPages: number;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  authorId: string;

  @ApiPropertyOptional({ isArray: true, type: () => CreateBookDetailsDto })
  @Type(() => CreateBookDetailsDto)
  @IsArray()
  @IsOptional()
  bookDetails?: CreateBookDetailsDto[];
}

export class CreateBookDetailsDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page: number;
}

export class CreateBookPageDto extends CreateBookDetailsDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  bookId: string;
}
