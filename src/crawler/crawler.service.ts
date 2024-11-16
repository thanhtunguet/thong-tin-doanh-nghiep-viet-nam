import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import * as moment from 'moment';
import { sleep } from 'openai/core';
import { firstValueFrom } from 'rxjs';
import { SLEEP_GAP, SLEEP_MIN, SOURCE_URL, WEB_URL } from 'src/_config/dotenv';
import {
  Business,
  Company,
  CompanyBusinessMapping,
  District,
  Province,
  ProvinceGroup,
  Ward,
} from 'src/_entities';
import { splitArrayByLength } from 'src/_helpers/array';
import { vietnameseSlugify } from 'src/_helpers/slugify';
import { InfoRepository } from 'src/_repositories/info-repository';
import { In, IsNull, Repository } from 'typeorm';

@Injectable()
export class CrawlerService implements OnApplicationBootstrap {
  private static PAGE_SIZE = 20;

  private static getCompanyIdFromTaxCode(taxCode: string) {
    return Number(taxCode.replace(/-/g, ''));
  }

  private static getCompanySlug(link: string) {
    return link
      .replace(WEB_URL, '')
      .replace(SOURCE_URL, '')
      .replace('/thong-tin/', '')
      .replace('.html', '');
  }

  private provinceSlugMap: Map<string, Province>;

  private districtSlugMap: Map<string, District>;

  private wardSlugMap: Map<string, Ward>;

  private handleCompanyAddress(company: Company) {
    const address = company.address || '';
    if (!address) {
      console.warn(`Company ${company.id} has an empty address.`);
      return;
    }

    // Use the regex patterns
    const addressParts = address.split(',').map((part) => part.trim());

    const provincePart = addressParts[addressParts.length - 1] || '';
    const districtPart = addressParts[addressParts.length - 2] || '';
    const wardPart = addressParts[addressParts.length - 3] || '';

    // Regex patterns
    const provinceRegex = /(?:Tỉnh|Thành phố|TP)?\s*(.+)/i;
    const districtRegex = /(?:Quận|Huyện|Thị xã|Thành phố|TP)?\s*(.+)/i;
    const wardRegex = /(?:Phường|Xã|Thị trấn)?\s*(.+)/i;

    // Extract names
    const provinceMatch = provincePart.match(provinceRegex);
    const districtMatch = districtPart.match(districtRegex);
    const wardMatch = wardPart.match(wardRegex);

    const provinceName = provinceMatch ? provinceMatch[1].trim() : provincePart;
    const districtName = districtMatch ? districtMatch[1].trim() : districtPart;
    const wardName = wardMatch ? wardMatch[1].trim() : wardPart;

    company.provinceName = provinceName;
    company.districtName = districtName;
    company.wardName = wardName;

    return company;
  }

  private async getLastPageOfProvince(group: ProvinceGroup): Promise<number> {
    const html = await firstValueFrom(
      this.infoRepository.crawlPage(`/${group.code}/`),
    );
    const $ = cheerio.load(html);
    const href = $('.last-page').children('a').attr('href');
    const pages = href.replace(/^(.*)\/trang-([0-9]+)\/?$/gm, '$2');
    return Number(pages);
  }

  private async getLastPageCountOfProvinceGroup(provinceGroup: ProvinceGroup) {
    const html = await firstValueFrom(
      this.infoRepository.crawlPage(
        `/${provinceGroup.code}/trang-${provinceGroup.pages}/`,
      ),
    );
    const $ = cheerio.load(html);
    return $('.company-name a').length;
  }

  public constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(ProvinceGroup)
    private readonly provinceGroupRepository: Repository<ProvinceGroup>,

    @InjectRepository(CompanyBusinessMapping)
    private readonly companyBusinessMappingRepository: Repository<CompanyBusinessMapping>,
    private readonly infoRepository: InfoRepository,
  ) {}

  public async onApplicationBootstrap() {
    // Load all administrative units
    const provinces = await this.provinceRepository.find();
    const districts = await this.districtRepository.find();
    const wards = await this.wardRepository.find();

    // Prepare maps for quick lookup by slug
    this.provinceSlugMap = new Map<string, Province>();
    provinces.forEach((prov) => {
      let slug = prov.slug || '';
      if (!slug) {
        slug = vietnameseSlugify(prov.name);
        prov.slug = slug; // Optionally update the slug in the database
      }
      this.provinceSlugMap.set(slug, prov);
    });

    this.districtSlugMap = new Map<string, District>();
    districts.forEach((dist) => {
      let slug = dist.slug || '';
      if (!slug) {
        slug = vietnameseSlugify(dist.name);
        dist.slug = slug; // Optionally update the slug in the database
      }
      this.districtSlugMap.set(slug, dist);
    });

    this.wardSlugMap = new Map<string, Ward>();
    wards.forEach((wd) => {
      let slug = wd.slug || '';
      if (!slug) {
        slug = vietnameseSlugify(wd.name);
        wd.slug = slug; // Optionally update the slug in the database
      }
      this.wardSlugMap.set(slug, wd);
    });

    console.log('Loaded all administrative units');
  }

  public async getProvinceGroups(): Promise<ProvinceGroup[]> {
    const html = await firstValueFrom(this.infoRepository.crawlPage('/'));
    const $: CheerioAPI = cheerio.load(html);

    const anchors = $('.list-link')
      .children()
      .map(function () {
        return $(this).children('a');
      })
      .toArray();

    const groups = anchors.map((anchor): ProvinceGroup => {
      const group = this.provinceGroupRepository.create();
      group.link = anchor.attr('href');
      group.name = anchor.text();
      group.code = group.link.replace(WEB_URL, '').split('/').join('');
      return group;
    });

    const chunks = splitArrayByLength(groups, 6);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (page: ProvinceGroup) => {
          page.pages = await this.getLastPageOfProvince(page);
          page.lastPageCount = await this.getLastPageCountOfProvinceGroup(page);
          page.total =
            page.pages * CrawlerService.PAGE_SIZE +
            page.lastPageCount -
            CrawlerService.PAGE_SIZE;
        }),
      );
      await sleep(Math.random() * SLEEP_GAP + SLEEP_MIN);
    }

    await this.provinceGroupRepository.clear();
    return this.provinceGroupRepository.save(groups);
  }

  public async crawlCompany(html: string) {
    const $ = cheerio.load(html);

    let newCompany: Company = this.companyRepository.create();

    newCompany.name = $(
      '.company-info-section .responsive-table-cell[itemprop="name"]',
    )
      .text()
      .trim();

    newCompany.slug = CrawlerService.getCompanySlug(
      $('link[rel="canonical"]').attr('href'),
    );

    newCompany.alternateName = $(
      '.company-info-section .responsive-table-cell[itemprop="alternateName"]',
    )
      .text()
      .trim();

    newCompany.description = $('.description[itemprop="description"]')
      .text()
      .trim();

    newCompany.taxCode = $(
      'div.company-info-section .responsive-table-cell[itemprop="taxID"]',
    )
      .text()
      .trim();

    newCompany.id = CrawlerService.getCompanyIdFromTaxCode(newCompany.taxCode);

    newCompany.address = $(
      'div.company-info-section .responsive-table-cell[itemprop="address"]',
    )
      .text()
      .trim();

    newCompany = this.handleCompanyAddress(newCompany);

    newCompany.representative = $(
      'div.company-info-section .responsive-table-cell[itemprop="founder"]',
    )
      .text()
      .trim();

    $('.company-info-section .responsive-table-cell').each(function () {
      const text = $(this).text().trim();

      if (text.match(/Ngày cấp giấy phép:/)) {
        const date = $(this).next().text().trim();
        newCompany.issuedAt = moment(date, 'DD/MM/YYYY').toDate();
        return;
      }

      if (text.match(/Tình trạng hoạt động:/)) {
        newCompany.currentStatus = $(this).next().text().trim();
        return;
      }
    });

    const businessChilds = $(
      '.responsive-table.responsive-table-2cols.responsive-table-collapse.nnkd-table',
    ).children();

    const businessArray = splitArrayByLength(
      $(businessChilds).toArray().slice(2),
      2,
    );

    const existingBusinesses = await this.businessRepository.find();
    const existingBusinessMap = Object.fromEntries(
      existingBusinesses.map((b) => [b.id, b]),
    );

    let businesses: Business[] = [];

    businessArray.forEach(([code, name]) => {
      const business: Business = this.businessRepository.create();

      business.code = $(code).text().trim();
      business.id = Number(business.code);
      business.name = $(name).text().trim();

      if (business.name.match(/Ngành chính/)) {
        business.name = business.name.replace(/\(Ngành chính\)/, '').trim();
        newCompany.mainBusiness = business.name;
        newCompany.mainBusinessId = business.id;
      }

      businesses = [...businesses, business];
    });

    const newBusinesses = businesses.filter((b) => !existingBusinessMap[b.id]);

    try {
      await this.businessRepository.save(newBusinesses);
    } catch (error) {
      console.error(
        `Error saving businesses with the following ids: ${newBusinesses
          .map((b) => b.id)
          .join(', ')}`,
      );
    }

    const companyBusinessMappings = businesses.map((business) => {
      const mapping = this.companyBusinessMappingRepository.create();
      mapping.companyId = newCompany.id;
      mapping.businessId = business.id;
      return mapping;
    });

    try {
      newCompany = await this.companyRepository.save(newCompany);
    } catch (error) {
      await this.companyRepository.update(newCompany.id, newCompany);
      console.error(`Error saving company`);
    }

    try {
      await this.companyBusinessMappingRepository.delete({
        companyId: newCompany.id,
      });

      await this.companyBusinessMappingRepository.save(companyBusinessMappings);
    } catch (error) {
      console.error(
        `Error saving company business mappings with the following ids: ${companyBusinessMappings
          .map((c) => c.companyId)
          .join(', ')}`,
      );
    }

    newCompany.companyBusinessMappings = companyBusinessMappings;

    return newCompany;
  }

  public async crawlPage(html: string) {
    const provinces = await this.provinceRepository.find();
    const provinceMap = Object.fromEntries(
      provinces.map((p) => [p.slug.toLowerCase(), p]),
    );

    const $ = cheerio.load(html);

    const companyRepository = this.companyRepository;

    let companies: Company[] = [];

    $('.company-item').each(function () {
      const company = companyRepository.create();

      const anchor = $(this).children().toArray()[1].children[0];
      company.slug = CrawlerService.getCompanySlug($(anchor).attr('href'));
      company.name = $(anchor).text().trim();

      const description = $(this).children('.description').contents();

      company.issuedAt = moment(
        $(description[3]).text().trim(),
        'DD/MM/YYYY',
      ).toDate();

      const province = vietnameseSlugify(
        $(description[1]).text().trim().toLowerCase(),
      );
      if (provinceMap[province]) {
        company.provinceId = provinceMap[province].id;
      }
      const info = $(this).children('p:nth-of-type(2)').text().trim();
      const matchResult =
        /^Mã số thuế: ([0-9]+\-?[0-9]+?)( \- Đại diện pháp luật: (.*))?$/gim.exec(
          info,
        );

      if (matchResult) {
        company.taxCode = matchResult[1];
        company.representative = matchResult[3];
        company.id = CrawlerService.getCompanyIdFromTaxCode(company.taxCode);
        company.address = $(this)
          .children('p:nth-of-type(3)')
          .text()
          .replace(/Địa chỉ:\s+/i, '')
          .trim();
        companies = [...companies, company];
      } else {
        console.log('Failed to parse company info', info);
        return;
      }
    });

    const companyIds = companies.map((c) => c.id);

    const existingCompanies = await this.companyRepository.find({
      where: { id: In(companyIds) },
    });

    const existingCompanyMap = Object.fromEntries(
      existingCompanies.map((c) => [c.id, c]),
    );

    const newCompanies = companies.filter(
      (c) => !Object.prototype.hasOwnProperty.call(existingCompanyMap, c.id),
    );

    try {
      await this.companyRepository.save(newCompanies);
      console.log(`Saved ${newCompanies.length} companies`);
    } catch (error) {
      console.error(`Error saving companies: ${companyIds.join(', ')}`);
    }

    return companies;
  }

  public async crawlCompanyByIdOrTaxCodeOrSlug(companyString: string) {
    const company = await this.companyRepository.findOne({
      where: [
        {
          id: CrawlerService.getCompanyIdFromTaxCode(companyString),
        },
        {
          taxCode: companyString,
        },
        {
          slug: companyString,
        },
      ],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const slug = company.slug;

    const html = await firstValueFrom(
      this.infoRepository.crawlPage(`/thong-tin/${slug}.html`),
    );

    return this.crawlCompany(html);
  }

  public async updateCompanyAdministrativeUnits() {
    const where = [
      { provinceId: IsNull() },
      { districtId: IsNull() },
      { wardId: IsNull() },
    ];
    const count = await this.companyRepository.count({
      where,
    });

    const GAP = 100;

    for (let i = 0; i < count; i += GAP) {
      // Fetch companies missing administrative unit IDs
      const companies = await this.companyRepository.find({
        where,
        skip: i * GAP,
        take: GAP,
      });

      if (companies.length === 0) {
        console.log('No companies need updating.');
        return;
      }

      for (const company of companies) {
        const address = company.address || '';

        if (!address) {
          console.warn(`Company ${company.id} has an empty address.`);
          continue;
        }

        // Split address into parts
        const addressParts = address.split(',').map((part) => part.trim());

        const provincePart = addressParts[addressParts.length - 1] || '';
        const districtPart = addressParts[addressParts.length - 2] || '';
        const wardPart = addressParts[addressParts.length - 3] || '';

        // Regex patterns
        const provinceRegex = /(?:Tỉnh|Thành phố|TP)?\s*(.+)/i;
        const districtRegex = /(?:Quận|Huyện|Thị xã|Thành phố|TP)?\s*(.+)/i;
        const wardRegex = /(?:Phường|Xã|Thị trấn)?\s*(.+)/i;

        // Extract names
        const provinceMatch = provincePart.match(provinceRegex);
        const districtMatch = districtPart.match(districtRegex);
        const wardMatch = wardPart.match(wardRegex);

        const provinceName = provinceMatch
          ? provinceMatch[1].trim()
          : provincePart;
        const districtName = districtMatch
          ? districtMatch[1].trim()
          : districtPart;
        const wardName = wardMatch ? wardMatch[1].trim() : wardPart;

        // Normalize and slugify names
        const slugifiedProvinceName = vietnameseSlugify(provinceName);
        const slugifiedDistrictName = vietnameseSlugify(districtName);
        const slugifiedWardName = vietnameseSlugify(wardName);

        // Search for province where slug ends with slugifiedProvinceName
        let province: Province = null;
        for (const [slug, prov] of this.provinceSlugMap.entries()) {
          if (slug.endsWith(slugifiedProvinceName)) {
            province = prov;
            break;
          }
        }

        if (province) {
          company.provinceId = province.id;
        } else {
          console.warn(
            `Province not found for company ${company.id}, address: ${address}`,
          );
        }

        // Search for district
        let district: District = null;
        if (province) {
          for (const [slug, dist] of this.districtSlugMap.entries()) {
            if (
              dist.provinceId === province.id &&
              slug.endsWith(slugifiedDistrictName)
            ) {
              district = dist;
              break;
            }
          }
        } else {
          // If province not found, search all districts
          for (const [slug, dist] of this.districtSlugMap.entries()) {
            if (slug.endsWith(slugifiedDistrictName)) {
              district = dist;
              break;
            }
          }
          if (district && !province) {
            company.provinceId = district.provinceId;
            province = Object.values(this.provinceSlugMap).find(
              (p) => p.id === district.provinceId,
            );
          }
        }

        if (district) {
          company.districtId = district.id;
        } else {
          console.warn(
            `District not found for company ${company.id}, address: ${address}`,
          );
        }

        // Search for ward
        let ward: Ward = null;
        if (district) {
          for (const [slug, wd] of this.wardSlugMap.entries()) {
            if (
              wd.districtId === district.id &&
              slug.endsWith(slugifiedWardName)
            ) {
              ward = wd;
              break;
            }
          }
        } else {
          // If district not found, search all wards
          for (const [slug, wd] of this.wardSlugMap.entries()) {
            if (slug.endsWith(slugifiedWardName)) {
              ward = wd;
              break;
            }
          }
          if (ward && !district) {
            company.districtId = ward.districtId;
            district = Object.values(this.districtSlugMap).find(
              (d) => d.id === ward.districtId,
            );
            if (district && !province) {
              company.provinceId = district.provinceId;
              province = Object.values(this.provinceSlugMap).find(
                (p) => p.id === district.provinceId,
              );
            }
          }
        }

        if (ward) {
          company.wardId = ward.id;
        } else {
          console.warn(
            `Ward not found for company ${company.id}, address: ${address}`,
          );
        }

        console.log(
          `Saved new address for company ${company.id}, provinceId: ${company.provinceId}, districtId: ${company.districtId}, wardId: ${company.wardId}`,
        );

        await this.companyRepository.update(company.id, company);
      }
    }
  }
}
