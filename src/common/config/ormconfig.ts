import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { SnakeNamingStrategy } from './snake-naming.config';

dotenvConfig({ path: '.env' });

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: +process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/**/*{.ts,.js}'],
  migrationsRun: true,
  namingStrategy: new SnakeNamingStrategy(),
};

export const connectionSource: DataSource = new DataSource(config as DataSourceOptions);
