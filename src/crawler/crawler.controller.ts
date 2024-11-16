import { Controller, Get, OnApplicationBootstrap, Param } from '@nestjs/common';
import {
  Client,
  ClientProxy,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AppMode, MODE, MQTT_URL } from 'src/_config/dotenv';
import { Company } from 'src/_entities';
import { InfoRepository } from 'src/_repositories/info-repository';
import { CrawlerService } from './crawler.service';
import { ProvinceGroupDto } from './dtos/province-group.dto';

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
    return this.crawlerService.crawlCompanyByIdOrTaxCodeOrSlug(company);
  }

  @MessagePattern('crawler/sync-address')
  public async syncAddress() {
    return this.crawlerService.updateCompanyAdministrativeUnits();
  }

  @Get('/trigger-sync-address')
  public async triggerSyncAddress() {
    return this.crawlerService.updateCompanyAdministrativeUnits();
  }
}
