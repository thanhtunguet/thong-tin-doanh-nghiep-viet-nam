import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { Company } from 'src/_entities';
import { InfoRepository } from 'src/_repositories/info-repository';
import { CrawlerService } from './crawler.service';
import { ProvinceGroupDto } from './dtos/province-group.dto';

@ApiTags('Crawler')
@Controller('/api/crawler')
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly infoRepository: InfoRepository,
  ) {}

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
}
