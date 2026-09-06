import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let connectionString =
      process.env.DATABASE_URL ||
      'postgresql://dummy:dummy@localhost:5432/dummy';

    if (!process.env.DATABASE_URL) {
      console.warn('PrismaService: DATABASE_URL is not set in process.env');
    } else {
      if (!connectionString.includes('pgbouncer=')) {
        connectionString += connectionString.includes('?')
          ? '&pgbouncer=true'
          : '?pgbouncer=true';
      }
      if (!connectionString.includes('connection_limit=')) {
        connectionString += '&connection_limit=1';
      }
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
