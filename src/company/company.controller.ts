import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/_dtos/query.dto';
import { CompanyService } from './company.service';

@ApiTags('Company')
@Controller('/api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('/')
  public async list(@Query('skip') skip = 0, @Query('take') take = 10) {
    return this.companyService.list(skip, take);
  }

  @Get('/count')
  public async count() {
    return this.companyService.count();
  }

  @Get('/provinces/count')
  @ApiQuery({
    type: QueryDto,
  })
  public async countByProvince(@Param('provinceId') provinceId: number) {
    return this.companyService.countByProvince(provinceId);
  }

  @Get('/provinces/:provinceId')
  @ApiQuery({
    type: QueryDto,
  })
  public async searchByProvince(
    @Param('provinceId') provinceId: number,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.companyService.searchByProvince(provinceId, skip, take);
  }

  @Get('/:idOrTaxCode')
  public async get(@Param('idOrTaxCode') idOrTaxCode: string) {
    return this.companyService.getByIdOrTaxCode(idOrTaxCode);
  }
}
