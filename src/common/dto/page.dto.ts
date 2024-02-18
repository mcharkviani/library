import { ApiProperty } from '@nestjs/swagger';

interface IPageMeta {
  total: number;
  page: number;
  limit: number;
}

export class PageDto<T> {
  @ApiProperty({
    isArray: true,
  })
  readonly data: T[];

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly limit: number;

  constructor(data: T[], { total, page, limit }: IPageMeta) {
    this.data = data;
    this.total = total;
    this.page = +page;
    this.limit = +limit;
  }
}
