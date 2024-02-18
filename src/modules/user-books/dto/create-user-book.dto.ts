import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateUserBookDto {
  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}
