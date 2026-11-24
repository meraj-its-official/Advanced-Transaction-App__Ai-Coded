import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@wallet-web-app/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error: any) {
      this.logger.error(
        `Failed to connect to database: ${error?.message || error}. Please make sure PostgreSQL is running.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
