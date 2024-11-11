import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryDto } from '../_dtos/query.dto';
import { Company, District, Province, Ward } from '../_entities';
import { DivisionService } from './division.service';
import { QAPairDto } from './dtos/qr-pair';

@ApiTags('Division')
@Controller('/api/division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get('/provinces')
  @ApiResponse({
    type: Province,
    isArray: true,
  })
  public provinces(@Query() filter: QueryDto): Promise<Province[]> {
    return this.divisionService.provinces(filter);
  }

  @Get('/provinces/:provinceId')
  public async getProvince(
    @Param('provinceId') provinceId: number,
  ): Promise<Province> {
    return this.divisionService.getProvince(provinceId);
  }

  @Get('/provinces/:provinceId/companies')
  public async provinceCompanies(
    @Param('provinceId') provinceId: number,
  ): Promise<Company[]> {
    return this.divisionService.getCompaniesOfProvince(provinceId);
  }

  @Get('/provinces/:provinceId/districts')
  public async provinceDistricts(
    @Param('provinceId') provinceId: number,
  ): Promise<District[]> {
    return this.divisionService.getDistrictsOfProvince(provinceId);
  }

  @Get('/districts')
  @ApiResponse({
    type: District,
    isArray: true,
  })
  public districts(@Query() filter: QueryDto): Promise<District[]> {
    return this.divisionService.districts(filter);
  }

  @Get('/districts/:districtId')
  public async getDistrict(
    @Param('districtId') districtId: number,
  ): Promise<District> {
    return this.divisionService.getDistrict(districtId);
  }

  @Get('/districts/:districtId/companies')
  public async districtCompanies(
    @Param('districtId') districtId: number,
  ): Promise<Company[]> {
    return this.divisionService.getCompaniesOfDistrict(districtId);
  }

  @Get('/districts/:districtId/wards')
  public async districtWards(
    @Param('districtId') districtId: number,
  ): Promise<Ward[]> {
    return this.divisionService.getWardsOfDistrict(districtId);
  }

  @Get('/wards')
  @ApiResponse({
    type: Ward,
    isArray: true,
  })
  public wards(@Query() filter: QueryDto): Promise<Ward[]> {
    return this.divisionService.wards(filter);
  }

  @Get('/wards/:wardId')
  public async getWard(@Param('wardId') wardId: number): Promise<Ward> {
    return this.divisionService.getWard(wardId);
  }

  @Get('/wards/:wardId/companies')
  public async wardCompanies(
    @Param('wardId') wardId: number,
  ): Promise<Company[]> {
    return this.divisionService.getCompaniesOfWard(wardId);
  }

  @Get('/extract-data')
  public async extractData(): Promise<QAPairDto[]> {
    return this.divisionService.extractData();
  }
}
