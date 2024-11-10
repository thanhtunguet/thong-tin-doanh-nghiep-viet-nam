import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDto } from '../_dtos/query.dto';
import { Company, District, Province, Ward } from '../_entities';

@Injectable()
export class DivisionService {
  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {
    
  }

  provinces(filter: QueryDto) {
    return this.provinceRepository.find(filter);
  }

  getProvince(provinceId: number) {
    return this.provinceRepository.findOne({
      where: { id: provinceId },
    });
  }

  getCompaniesOfProvince(provinceId: number) {
    return this.companyRepository.find({
      where: { province: { id: provinceId } },
    });
  }

  getDistrictsOfProvince(provinceId: number) {
    return this.districtRepository.find({
      where: {
        province: {
          id: provinceId,
        },
      },
    });
  }



  districts(filter: QueryDto) {
    return this.districtRepository.find(filter);
  }

  getDistrict(districtId: number) {
    return this.districtRepository.findOne({
      where: { id: districtId },
    });
  }

  getCompaniesOfDistrict(districtId: number) {
    return this.companyRepository.find({
      where: { district: { id: districtId } },
    });
  }

  getWardsOfDistrict(districtId: number) {
    return this.wardRepository.find({
      where: {
        district: {
          id: districtId,
        },
      },
    });
  }

  wards(filter: QueryDto) {
    return this.wardRepository.find(filter);
  }

  getWard(wardId: number) {
    return this.wardRepository.findOne({
      where: { id: wardId },
    });
  } 

  getCompaniesOfWard(wardId: number) {
    return this.companyRepository.find({
      where: { ward: { id: wardId } },
    });
  }
}
