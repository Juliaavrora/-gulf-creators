import { Module } from '@nestjs/common';
import { AccessService } from './access/access.service';
import { AdminService } from './admin/admin.service';
import { ModerationController } from './admin/moderation.controller';
import { CreatorsController } from './creators/creators.controller';
import { CreatorsService } from './creators/creators.service';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { MediaController } from './media/media.controller';
import { MediaStorageService } from './media/media-storage.service';
import { MediaUrlSignerService } from './media/media-url.signer';
import { UploadsController } from './media/uploads.controller';
import { PostsController } from './posts/posts.controller';
import { PrismaModule } from './prisma/prisma.service';
import { StudioService } from './viewer/studio.service';
import { ViewerService } from './viewer/viewer.service';

@Module({
  imports: [PrismaModule],
  // UploadsController раньше MediaController: иначе `media/:id` перехватит `media/uploads`.
  controllers: [HealthController, MeController, CreatorsController, UploadsController, MediaController, PostsController, ModerationController],
  providers: [AccessService, AdminService, CreatorsService, MediaStorageService, MediaUrlSignerService, StudioService, ViewerService],
})
export class AppModule {}
