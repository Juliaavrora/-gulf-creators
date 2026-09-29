import { BadRequestException, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedMediaDto } from '@gulf/shared';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StudioService } from '../viewer/studio.service';
import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES, processPhoto } from './image-processor';
import { MediaStorageService, previewKey } from './media-storage.service';

/**
 * Загрузка фото автором. Сейчас файл идёт через API в локальное хранилище;
 * в проде клиент получит presigned URL и загрузит прямо в S3 (видео — в Mux Direct Upload).
 */
@Controller('media/uploads')
export class UploadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
    private readonly studio: StudioService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: PHOTO_MAX_BYTES, files: 1 } }))
  async upload(@Req() req: Request, @UploadedFile() file: Express.Multer.File | undefined): Promise<UploadedMediaDto> {
    const creator = await this.studio.requirePublishingCreator(req);
    if (!file) throw new BadRequestException('file_required');
    if (file.mimetype.startsWith('video/')) throw new BadRequestException('video_not_supported_yet');
    if (!PHOTO_MIME_TYPES.includes(file.mimetype)) throw new BadRequestException('unsupported_file_type');

    let processed;
    try {
      processed = await processPhoto(file.buffer);
    } catch {
      throw new BadRequestException('not_an_image');
    }

    const media = await this.prisma.client.media.create({
      data: { ownerId: creator.userId, kind: 'photo', status: 'processing' },
    });
    const key = `${media.id}.jpg`;
    await this.storage.save(key, processed.full);
    await this.storage.save(previewKey(key), processed.preview);
    await this.prisma.client.media.update({ where: { id: media.id }, data: { storageKey: key, status: 'ready' } });

    return { id: media.id, kind: 'photo', previewPath: `/media/${media.id}/preview` };
  }
}
