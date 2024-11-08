import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Province, ProvinceGroup } from 'src/_entities';
import { Repository } from 'typeorm';
import { CrawlerService } from './crawler.service';

@ApiTags('Proxy')
@Controller('proxy')
export class ProxyController {
  constructor(
    private readonly crawlerService: CrawlerService,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(ProvinceGroup)
    private readonly provinceGroupRepository: Repository<ProvinceGroup>,
  ) {}

  @Get('/sync-address')
  public async syncAddress() {
    await this.crawlerService.syncAddress();
    return '';
  }

  @Get('/sync-source-code')
  public async syncSourceCode() {
    const provinces = await this.provinceRepository.find();
    const provinceMap = Object.fromEntries(
      provinces.map((p) => [p.sourceCode, p]),
    );
    const groups = await this.provinceGroupRepository.find();
    for (const group of groups) {
      const key = group.code.toLowerCase();
      if (provinceMap[key]) {
        const newGroup = this.provinceGroupRepository.create();
        Object.assign(newGroup, group);
        newGroup.id = provinceMap[key].id;
        await this.provinceGroupRepository.delete(group.id);
        await this.provinceGroupRepository.save(newGroup);
      } else {
        console.log(key);
      }
    }
    return '';
  }

  @Get('/province-groups')
  @ApiResponse({
    type: String,
  })
  public async provinceGroups(): Promise<ProvinceGroup[]> {
    const provincePages = await this.crawlerService.getProvincePages();
    this.crawlerService.saveProvinceGroups(provincePages);
    return provincePages;
  }
}
