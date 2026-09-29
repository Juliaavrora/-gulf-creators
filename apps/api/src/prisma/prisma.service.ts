import { Global, Injectable, Module, type OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient } from '@gulf/db';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client = createPrismaClient();

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
