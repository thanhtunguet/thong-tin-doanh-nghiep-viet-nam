import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDto } from '../_dtos/query.dto';
import { District, Province, Ward } from '../_entities';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
  ) {
    //
  }

  provinces(filter: QueryDto) {
    return this.provinceRepository.find(this.getFilters(filter));
  }

  districts(filter: QueryDto) {
    return this.districtRepository.find(this.getFilters(filter));
  }

  wards(filter: QueryDto) {
    return this.wardRepository.find(this.getFilters(filter));
  }

  private getFilters(filter: QueryDto) {
    const { skip = 0, take = 10 } = filter;
    return {
      skip,
      take,
    };
  }
}
