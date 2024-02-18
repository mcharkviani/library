import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Injectable()
export class AppService {
  constructor(private db: TypeOrmHealthIndicator) {}
  async checkDatabaseHealth(): Promise<HealthIndicatorResult> {
    return this.db.pingCheck('database');
  }
}
