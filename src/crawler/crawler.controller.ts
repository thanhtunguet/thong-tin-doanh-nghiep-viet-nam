import {
  Body,
  Controller,
  Get,
  OnApplicationBootstrap,
  Param,
  Post,
} from '@nestjs/common';
import {
  Client,
  ClientProxy,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AppMode, MODE, MQTT_URL } from 'src/_config/dotenv';
import { Company } from 'src/_entities';
import { InfoRepository } from 'src/_repositories/info-repository';
import { CrawlerService } from './crawler.service';
import { ProvinceGroupDto } from './dtos/province-group.dto';

enum CrawlerMessagePattern {
  CRAWL_PAGE = 'CRAWL_PAGE',
  CRAWL_PAGE_WEB = 'CRAWL_PAGE_WEB',
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

  @Post('/save-companies')
  @ApiBody({
    type: Company,
    isArray: true,
  })
  public async saveCompanies(@Body() companies: Company[]) {
    return this.crawlerService.saveCompanies(companies);
  }

  @Post('/save-company')
  @ApiBody({
    type: Company,
  })
  public async saveCompanyDetail(@Body() company: Company) {
    return this.crawlerService.saveCompany(company);
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

  @MessagePattern(CrawlerMessagePattern.CRAWL_PAGE_WEB)
  public async handleCrawlPagePatternWeb() {
    return this.crawlerService.handleCrawlPagePatternWeb();
  }

  @Get('/trigger-all')
  public async triggerAll() {
    await this.client.emit(CrawlerMessagePattern.CRAWL_PAGE, {});
    return 'All jobs have been triggered';
  }

  @Get('/trigger-web')
  public async triggerWeb() {
    await this.client.emit(CrawlerMessagePattern.CRAWL_PAGE_WEB, {
      province: 'TP.HCM',
      page: 1,
    });
    return 'All jobs have been triggered';
  }
}
