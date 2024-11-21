import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/_entities';
import { Repository } from 'typeorm';
import { CompanyQueryDto } from './dtos/company-query.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  public async list(query: CompanyQueryDto): Promise<Company[]> {
    return this.companyRepository.find({
      skip: query.skip,
      take: query.take,
      where: [
        {
          provinceId: query.provinceId,
        },
        {
          districtId: query.districtId,
        },
        {
          wardId: query.wardId,
        },
      ],
    });
  }

  public async count(): Promise<number> {
    return this.companyRepository.count();
  }

  public async searchByProvince(
    provinceId: number,
    skip: number,
    take: number,
  ): Promise<Company[]> {
    return this.companyRepository.find({
      where: {
        provinceId,
      },
      skip,
      take,
    });
  }

  public async countByProvince(provinceId: number): Promise<number> {
    return this.companyRepository.countBy({
      provinceId,
    });
  }

  public async getByIdOrTaxCode(idOrTaxCode: string): Promise<Company> {
    return this.companyRepository.findOne({
      where: [{ id: Number(idOrTaxCode) }, { taxCode: idOrTaxCode }],
      relations: ['province', 'district', 'ward'],
    });
  }
}
