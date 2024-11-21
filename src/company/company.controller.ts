import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryDto } from 'src/_dtos/query.dto';
import { CompanyService } from './company.service';
import { CompanyQueryDto } from './dtos/company-query.dto';

@ApiTags('Company')
@Controller('/api/company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('/')
  @ApiBody({
    type: CompanyQueryDto,
  })
  public async list(@Query() query: CompanyQueryDto) {
    return this.companyService.list(query);
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
