import {
  Body,
  Controller,
  Get,
  OnApplicationBootstrap,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  Client,
  ClientProxy,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { AppMode, MODE, MQTT_URL } from 'src/_config/dotenv';
import { Company } from 'src/_entities';
import { InfoRepository } from 'src/_repositories/info-repository';
import { CrawlerService } from './crawler.service';
import { ProvinceGroupDto } from './dtos/province-group.dto';

enum CrawlerMessagePattern {
  CRAWL_PAGE = 'CRAWL_PAGE',
  CRAWL_COMPANY = 'CRAWL_COMPANY',
}

@ApiTags('Crawler')
@Controller('/api/crawler')
export class CrawlerController implements OnApplicationBootstrap {
  @Client({
    transport: Transport.MQTT,
    options: {
      url: MQTT_URL,
    },
  })
  private client: ClientProxy;

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly infoRepository: InfoRepository,
  ) {}

  async onApplicationBootstrap() {
    if (MODE === AppMode.CRAWLER) {
      await this.client.connect();
      console.log('Crawler is connected to MQTT');
    }
  }

  @Post('/add-companies')
  public async addCompanies(@Body() companies: Company[]) {
    return this.crawlerService.addCompanies(companies);
  }

  @Get('/province-groups')
  @ApiResponse({
    type: ProvinceGroupDto,
    isArray: true,
  })
  public async provinceGroups(): Promise<ProvinceGroupDto[]> {
    return this.crawlerService.getProvinceGroups();
  }

  @Get('/province/:province/:page')
  public async crawlPage(
    @Param('province') province: string,
    @Param('page') page: number,
  ): Promise<Company[]> {
    const html = await firstValueFrom(
      this.infoRepository.province(province, page),
    );
    return this.crawlerService.crawlPage(html);
  }

  @Get('/company/:company')
  public async crawlCompany(@Param('company') company: string) {
    const html = await firstValueFrom(this.infoRepository.company(company));
    return this.crawlerService.crawlCompany(html);
  }

  @MessagePattern(CrawlerMessagePattern.CRAWL_PAGE)
  public async handleCrawlPagePattern() {
    return this.crawlerService.handleCrawlPagePattern();
  }

  @Get('/trigger')
  public async trigger() {
    await this.client.emit(CrawlerMessagePattern.CRAWL_PAGE, {
      province: 'TP.HCM',
      page: 1,
    });
    return 'All jobs have been triggered';
  }
}
