import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { QueryDto } from '../_dtos/query.dto';
import { Company, District, Province, Ward } from '../_entities';
import { QAPairDto } from './dtos/qr-pair';

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
      where: { province: { id: provinceId } },
    });
  }

  public async getDistrictsOfProvince(provinceId: number) {
    return this.districtRepository.find({
      where: {
        province: {
          id: provinceId,
        },
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
      where: { district: { id: districtId } },
    });
  }

  public async getWardsOfDistrict(districtId: number) {
    return this.wardRepository.find({
      where: {
        district: {
          id: districtId,
        },
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
      where: { ward: { id: wardId } },
    });
  }

  public async extractData() {
    // Repositories
    const provinceRepository = this.provinceRepository;
    const districtRepository = this.districtRepository;
    const wardRepository = this.wardRepository;

    // Step 1: Extract data from the database
    const provinces = await provinceRepository.find({
      relations: ['districts', 'districts.wards'],
    });
    const districts = await districtRepository.find({
      relations: ['wards', 'province'],
    });
    const wards = await wardRepository.find({
      relations: ['district', 'district.province'],
    });

    // Create dictionaries for quick lookup
    const provinceDict = new Map<number, Province>();
    provinces.forEach((province) => provinceDict.set(province.id, province));

    const districtDict = new Map<number, District>();
    districts.forEach((district) => districtDict.set(district.id, district));

    // Step 2: Generate question-answer pairs
    const qaPairs: QAPairDto[] = [];

    // 1. How many provinces in Vietnam and their names
    const numberOfProvinces = provinces.length;
    const provinceNames = provinces.map((p) => p.name).join(', ');
    qaPairs.push({
      prompt: 'How many provinces are there in Vietnam?',
      completion: `Vietnam has ${numberOfProvinces} provinces: ${provinceNames}.`,
    });

    // 2. How many districts in a specific province and their names
    for (const province of provinces) {
      const provinceDistricts = districts.filter(
        (d) => d.province.id === province.id,
      );
      const numberOfDistricts = provinceDistricts.length;
      const districtNames = provinceDistricts.map((d) => d.name).join(', ');
      qaPairs.push({
        prompt: `How many districts are in ${province.name}?`,
        completion: `${province.name} has ${numberOfDistricts} districts: ${districtNames}.`,
      });
    }

    // 3. How many communes in a specific district and their names
    for (const district of districts) {
      const districtWards = wards.filter((w) => w.district.id === district.id);
      const numberOfWards = districtWards.length;
      const wardNames = districtWards.map((w) => w.name).join(', ');
      const province = provinceDict.get(district.province.id);
      if (province) {
        qaPairs.push({
          prompt: `How many communes are in ${district.name}, ${province.name}?`,
          completion: `${district.name} district in ${province.name} has ${numberOfWards} communes: ${wardNames}.`,
        });
      }
    }

    // 4. Difference between unit types
    const unitTypeDescriptions: Record<string, string> = {
      Tỉnh: 'a province, typically rural or semi-urban',
      'Thành phố trực thuộc Trung ương':
        'a centrally-managed city with provincial status',
      Quận: 'an urban district within a city',
      Huyện: 'a rural district within a province',
      'Thị xã': 'a town with administrative powers less than a city',
      Xã: 'a commune, the lowest administrative rural unit',
      Phường: 'a ward, the lowest administrative urban unit',
      'Thị trấn': 'a township, an urbanized commune',
    };

    const unitTypePairs: [string, string][] = [
      ['Tỉnh', 'Thành phố trực thuộc Trung ương'],
      ['Quận', 'Huyện'],
      ['Xã', 'Phường'],
      ['Thị xã', 'Thành phố trực thuộc Trung ương'],
    ];

    for (const [unitType1, unitType2] of unitTypePairs) {
      const description1 = unitTypeDescriptions[unitType1];
      const description2 = unitTypeDescriptions[unitType2];
      qaPairs.push({
        prompt: `What is the difference between a '${unitType1}' and '${unitType2}'?`,
        completion: `A '${unitType1}' is ${description1}, while a '${unitType2}' is ${description2}.`,
      });
    }

    // 5. Given a name, identify its level and ancestors
    // For Provinces
    for (const province of provinces) {
      qaPairs.push({
        prompt: `What administrative level is '${province.name}'?`,
        completion: `'${province.name}' is a province-level unit in Vietnam.`,
      });
    }

    // For Districts
    for (const district of districts) {
      const province = provinceDict.get(district.province.id);
      if (province) {
        qaPairs.push({
          prompt: `What administrative level is '${district.name}'?`,
          completion: `'${district.name}' is a district-level unit in ${province.name}.`,
        });
      }
    }

    // For Wards
    for (const ward of wards) {
      const district = districtDict.get(ward.district.id);
      const province = provinceDict.get(ward.district.province.id);
      if (district && province) {
        qaPairs.push({
          prompt: `What administrative level is '${ward.name}'?`,
          completion: `'${ward.name}' is a commune-level unit in ${district.name}, ${province.name}.`,
        });
      }
    }

    // Step 3: Save all generated questions to json file
    fs.writeFileSync(
      'vietnamese_administrative_units_train.json',
      JSON.stringify(qaPairs, null, 2),
      'utf-8',
    );

    console.log(
      `Generated ${qaPairs.length} question-answer pairs and saved to 'vietnamese_administrative_units_train.json'.`,
    );

    return qaPairs;
  }
}
