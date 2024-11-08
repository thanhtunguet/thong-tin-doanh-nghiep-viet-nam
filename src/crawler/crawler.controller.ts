import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';

@ApiTags('Crawler')
@Controller('/api/crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('/:province/trang-:page/')
  public async crawlPage(
    @Param('province') province: string,
    @Param('page') page: string,
  ) {
    return this.crawlerService.crawlPage(province, Number(page ?? '1'));
  }

  @Get('/:province/')
  public async crawlProvinceFirstPage(@Param('province') province: string) {
    return this.crawlPage(province, '1');
  }
}
