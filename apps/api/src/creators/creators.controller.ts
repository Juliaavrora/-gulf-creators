import { Controller, Get, NotFoundException, Param, Query, Req } from '@nestjs/common';
import type { CreatorProfileDto, PostDto, PostFilter } from '@gulf/shared';
import type { Request } from 'express';
import { ViewerService } from '../viewer/viewer.service';
import { CreatorsService } from './creators.service';

const FILTERS: PostFilter[] = ['all', 'video', 'paid'];

@Controller('creators')
export class CreatorsController {
  constructor(
    private readonly creators: CreatorsService,
    private readonly viewer: ViewerService,
  ) {}

  @Get(':handle')
  async profile(@Param('handle') handle: string): Promise<CreatorProfileDto> {
    const profile = await this.creators.profile(handle);
    if (!profile) throw new NotFoundException();
    return profile;
  }

  @Get(':handle/posts')
  async posts(@Param('handle') handle: string, @Query('filter') filter: string | undefined, @Req() req: Request): Promise<PostDto[]> {
    const f = FILTERS.includes(filter as PostFilter) ? (filter as PostFilter) : 'all';
    const viewerId = await this.viewer.resolveViewerId(req);
    const posts = await this.creators.posts(handle, viewerId, f);
    if (!posts) throw new NotFoundException();
    return posts;
  }
}
