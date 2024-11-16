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
  ) {}

  public async provinces(filter: QueryDto) {
    return this.provinceRepository.find(filter);
  }

  public async getProvince(provinceId: number) {
    return this.provinceRepository.findOne({
      where: { id: provinceId },
    });
  }

  public async getCompaniesOfProvince(provinceId: number) {
    return this.companyRepository.find({
      where: { provinceId },
    });
  }

  public async getDistrictsOfProvince(provinceId: number) {
    return this.districtRepository.find({
      where: {
        provinceId,
      },
    });
  }

  public async districts(filter: QueryDto) {
    return this.districtRepository.find(filter);
  }

  public async getDistrict(districtId: number) {
    return this.districtRepository.findOne({
      where: { id: districtId },
    });
  }

  public async getCompaniesOfDistrict(districtId: number) {
    return this.companyRepository.find({
      where: { districtId },
    });
  }

  public async getWardsOfDistrict(districtId: number) {
    return this.wardRepository.find({
      where: {
        districtId,
      },
    });
  }

  public async wards(filter: QueryDto) {
    return this.wardRepository.find(filter);
  }

  public async getWard(wardId: number) {
    return this.wardRepository.findOne({
      where: { id: wardId },
    });
  }

  public async getCompaniesOfWard(wardId: number) {
    return this.companyRepository.find({
      where: { wardId },
    });
  }
}
