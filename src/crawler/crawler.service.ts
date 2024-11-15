import { Injectable } from '@nestjs/common';
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
  Province,
  ProvinceGroup,
} from 'src/_entities';
import { splitArrayByLength } from 'src/_helpers/array';
import { vietnameseSlugify } from 'src/_helpers/slugify';
import { InfoRepository } from 'src/_repositories/info-repository';
import { In, Repository } from 'typeorm';

@Injectable()
export class CrawlerService {
  static PAGE_SIZE = 20;

  private async getLastPageOfProvince(group: ProvinceGroup): Promise<number> {
    const html = await firstValueFrom(
      this.infoRepository.crawlPage(`/${group.code}/`),
    );
    const $ = cheerio.load(html);
    const href = $('.last-page').children('a').attr('href');
    const pages = href.replace(/^(.*)\/trang-([0-9]+)\/?$/gm, '$2');
    return Number(pages);
  }

  private static getCompanyIdFromTaxCode(taxCode: string) {
    return Number(taxCode.replace(/-/g, ''));
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

  private static getCompanySlug(link: string) {
    return link
      .replace(WEB_URL, '')
      .replace(SOURCE_URL, '')
      .replace('/thong-tin/', '')
      .replace('.html', '');
  }

  public constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(ProvinceGroup)
    private readonly provinceGroupRepository: Repository<ProvinceGroup>,
    @InjectRepository(CompanyBusinessMapping)
    private readonly companyBusinessMappingRepository: Repository<CompanyBusinessMapping>,
    private readonly infoRepository: InfoRepository,
  ) {}

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
    newCompany.representative = $(
      'div.company-info-section .responsive-table-cell[itemprop="founder"]',
    )
      .text()
      .trim();

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
      provinces.map((p) => [p.sourceCode.toLowerCase(), p]),
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
        company.province = provinceMap[province];
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
}
