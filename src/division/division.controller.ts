import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryDto } from '../_dtos/query.dto';
import { District, Province, Ward } from '../_entities';
import { DivisionService } from './division.service';

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

  @Get('/districts')
  @ApiResponse({
    type: District,
    isArray: true,
  })
  public districts(@Query() filter: QueryDto): Promise<District[]> {
    return this.divisionService.districts(filter);
  }

  @Get('/wards')
  @ApiResponse({
    type: Ward,
    isArray: true,
  })
  public wards(@Query() filter: QueryDto): Promise<Ward[]> {
    return this.divisionService.wards(filter);
  }
}
