import { Module } from '@nestjs/common';
import { AccessService } from './access/access.service';
import { CreatorsController } from './creators/creators.controller';
import { CreatorsService } from './creators/creators.service';
import { HealthController } from './health/health.controller';
import { MediaController } from './media/media.controller';
import { MediaStorageService } from './media/media-storage.service';
import { PrismaModule } from './prisma/prisma.service';
import { ViewerService } from './viewer/viewer.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, CreatorsController, MediaController],
  providers: [AccessService, CreatorsService, MediaStorageService, ViewerService],
})
export class AppModule {}
