import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/_entities';
import { Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  public async list(skip: number, take: number): Promise<Company[]> {
    return this.companyRepository.find({
      skip,
      take,
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
        province: { id: provinceId },
      },
      skip,
      take,
    });
  }

  public async countByProvince(provinceId: number): Promise<number> {
    return this.companyRepository.countBy({
      province: { id: provinceId },
    });
  }

  public async getByIdOrTaxCode(idOrTaxCode: string): Promise<Company> {
    return this.companyRepository.findOne({
      where: [{ id: Number(idOrTaxCode) }, { taxCode: idOrTaxCode }],
    });
  }
}
