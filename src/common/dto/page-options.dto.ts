import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @Min(1)
  @IsInt()
  @IsOptional()
  readonly page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsInt()
  @IsOptional()
  readonly limit: number = 10;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly search?: string;
}
