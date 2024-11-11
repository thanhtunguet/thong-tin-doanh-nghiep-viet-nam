import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import * as fs from 'fs';
import * as moment from 'moment';
import { sleep } from 'openai/core';
import { firstValueFrom } from 'rxjs';
import { WEB_URL } from 'src/_config/dotenv';
import { Business, Company, Province, ProvinceGroup } from 'src/_entities';
import { splitArrayByLength } from 'src/_helpers/array';
import { vietnameseSlugify } from 'src/_helpers/slugify';
import { InfoRepository } from 'src/_repositories/info-repository';
import { In, Repository } from 'typeorm';

export interface ICrawlerService {
  crawlPage(html: string): Promise<Company[]>;

  saveCompany(company: Company): Promise<void>;

  saveBusinesses(businesses: Business[]): Promise<void>;

  saveProvinceGroups(groups: ProvinceGroup[]): Promise<void>;
}

@Injectable()
export class CrawlerService implements ICrawlerService {
  static PAGE_SIZE = 20;

  private async getLastPageOfProvince(group: ProvinceGroup): Promise<number> {
    console.log(group);
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

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(ProvinceGroup)
    private readonly provinceGroupRepository: Repository<ProvinceGroup>,
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

    const chunks = splitArrayByLength(groups, 4);

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
    }

    await this.saveProvinceGroups(groups);

    return groups;
  }

  public async crawlCompany(html: string) {
    const $ = cheerio.load(html);

    const newCompany: Company = this.companyRepository.create();

    const elementName = $(
      '.company-info-section .responsive-table-cell[itemprop="name"]',
    );
    newCompany.name = elementName.text().trim();

    newCompany.sourceLink = $('link[rel="canonical"]').attr('href');
    newCompany.sourceLink = newCompany.sourceLink.replace(WEB_URL, '');

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

    newCompany.id = Number(
      CrawlerService.getCompanyIdFromTaxCode(newCompany.taxCode),
    );

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
        error,
      );
    }

    try {
      await this.companyRepository.delete({
        id: newCompany.id,
      });
      await this.companyRepository.save(newCompany);
    } catch (error) {
      console.error(`Error saving company`, error);
    }

    return {
      company: newCompany,
      businesses: businesses,
    };
  }

  public async saveProvinceGroups(groups: ProvinceGroup[]) {
    await this.provinceGroupRepository.clear();
    await this.provinceGroupRepository.save(groups);
  }

  public async saveBusinesses(businesses: Business[]) {
    const existingBusinesses = await this.businessRepository.find();
    const existingBusinessMap = Object.fromEntries(
      existingBusinesses.map((b) => [b.id, b]),
    );
    const newBusinesses = businesses.filter((b) => !existingBusinessMap[b.id]);
    await this.businessRepository.save(newBusinesses);
  }

  public async saveCompany(company: Company) {
    const existingCompany = await this.companyRepository.findOne({
      where: { id: company.id },
    });
    if (existingCompany) {
      await this.companyRepository.update(company.id, company);
    } else {
      await this.companyRepository.save(company);
    }
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
      company.sourceLink = $(anchor).attr('href');
      company.name = $(anchor).text().trim();

      const description = $(this).children('.description').contents();

      const date = $(description[3]).text().trim();
      const issuedAt = moment(date, 'DD/MM/YYYY').toDate();
      company.issuedAt = issuedAt;

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
      }
    });

    await this.companyRepository.delete({
      id: In(companies.map((c) => c.id)),
    });

    try {
      await this.companyRepository.save(companies);
      console.log(`Saved ${companies.length} companies`);
    } catch (error) {
      console.error(`Error saving companies: ${companies.map((c) => c.id)}`);
      fs.appendFileSync('companies.log', JSON.stringify(companies, null, 2));
      fs.appendFileSync('companies.log', '\n');
      fs.appendFileSync('companies.log', error.toString());
    }
    return companies;
  }

  public async handleCrawlPagePattern() {
    const provinceGroups = await this.provinceGroupRepository.find();
    for (const group of provinceGroups) {
      for (let i = 1; i <= group.pages; i++) {
        await axios
          .get(new URL(`/${group.code}/trang-${i}/`, WEB_URL).toString())
          .catch(() => {
            console.log(`Failed to crawl ${group.code}/trang-${i}/`);
          });
        const ms = Math.random() * 500;
        console.log(`Sleeping for ${ms}ms`);
        await sleep(ms);
      }
    }
  }
}
