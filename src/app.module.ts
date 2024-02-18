import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

import { TerminusModule } from '@nestjs/terminus';

import { TypeOrmConfigService } from './common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { BookModule } from './modules/books/book.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { UserBookModule } from './modules/user-books/user-book.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
      inject: [ConfigService],
    }),
    TerminusModule,
    UserModule,
    AuthModule,
    BookModule,
    UserBookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
