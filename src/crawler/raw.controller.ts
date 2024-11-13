import { Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CrawlerService } from './crawler.service';

@ApiTags('CrawlerRaw')
@Controller('/api/crawler')
export class RawController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('/from-html/page')
  @ApiBody({
    type: String,
  })
  @ApiConsumes('text/html')
  public async parsePageHtml(@Req() request: Request) {
    return this.crawlerService.crawlPage(request.body as string);
  }

  @Post('/from-html/company')
  @ApiBody({
    type: String,
  })
  @ApiConsumes('text/html')
  public async parseCompanyHtml(@Req() request: Request) {
    return this.crawlerService.crawlCompany(request.body as string);
  }
}
