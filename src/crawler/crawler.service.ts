import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios/index';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { MQTT_URL, SOURCE_URL } from 'src/_config/dotenv';
import { Business, Company, Province, ProvinceGroup } from 'src/_entities';
import { splitArrayByLength } from 'src/_helpers/array';
import { vietnameseSlugify } from 'src/_helpers/slugify';
import { InfoRepository } from 'src/_repositories/info-repository';
import { In, Repository } from 'typeorm';

const COMPANY_ID_REGEX = /^([A-Za-z0-9\-]+)\-([0-9]+)$/gim;

@Injectable()
export class CrawlerService implements OnApplicationBootstrap {
  static PAGE_SIZE = 20;

  @Client({
    transport: Transport.MQTT,
    options: {
      url: MQTT_URL,
    },
  })
  private readonly client: ClientProxy;

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

  public async onApplicationBootstrap(): Promise<void> {
    // await this.client
    //   .connect()
    //   .then(() => {
    //     console.log('Connected to MQTT');
    //   })
    //   .catch((error) => {
    //     console.error('Error connecting to MQTT', error);
    //   });
  }

  async getProvincePages(): Promise<ProvinceGroup[]> {
    const html = await axios.get(SOURCE_URL).then((resp) => resp.data);
    const $: CheerioAPI = cheerio.load(html);

    const anchors = $('.list-link')
      .children()
      .map(function () {
        return $(this).children('a');
      })
      .toArray();
    const provincePages = anchors.map((anchor): ProvinceGroup => {
      const group = this.provinceGroupRepository.create();
      group.link = anchor.attr('href');
      group.name = anchor.text();
      group.code = group.link.replace(SOURCE_URL, '').split('/').join('');
      return group;
    });

    const chunks = splitArrayByLength(provincePages, 4);
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
    return provincePages;
  }

  public async crawlCompany(company: string, html: string) {
    const companyId = company.replace(COMPANY_ID_REGEX, '$2');

    const $ = cheerio.load(html);

    const newCompany: Company = this.companyRepository.create();

    newCompany.id = Number(companyId);

    newCompany.name = $(
      '.company-info-section .responsive-table-cell[itemprop="name"]',
    )
      .text()
      .trim();
    newCompany.alternateName = $(
      '.company-info-section responsive-table-cell[itemprop="alternateName"]',
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
    newCompany.address = $(
      'div.company-info-section responsive-table-cell[itemprop="address"]',
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
      business.id = Number($(code).text().trim());
      business.code = $(code).text().trim();
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
      await this.businessRepository.insert(newBusinesses);
    } catch (error) {
      console.error(
        `Error saving businesses for ${company} with the following ids: ${newBusinesses
          .map((b) => b.id)
          .join(', ')}`,
        error,
      );
    }

    try {
      await this.companyRepository.save(newCompany);
    } catch (error) {
      console.error(`Error saving company ${company}`, error);
    }

    return newCompany;
  }

  private async getLastPageOfProvince(
    provincePage: ProvinceGroup,
  ): Promise<number> {
    console.log(provincePage);
    const html = await firstValueFrom(
      this.infoRepository.crawlPage(`/${provincePage.code}/`),
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

  private static parseCompanyIdFromTaxCode(taxCode: string) {
    return Number(taxCode.replace(/-/g, ''));
  }

  public async crawlPage(province: string, page = 1) {
    const provinces = await this.provinceRepository.find();
    const provinceMap = Object.fromEntries(
      provinces.map((p) => [p.sourceCode.toLowerCase(), p]),
    );
    const html = await firstValueFrom(
      this.infoRepository.province(province, page),
    );
    const $ = cheerio.load(html);

    const companyRepository = this.companyRepository;
    let companies: Company[] = [];
    $('.company-item').each(function () {
      const company = companyRepository.create();
      company.name = $(this).children('h3.company-name').text().trim();
      company.slug = $(this).children('h3.company-name a').attr('href');
      const description = $(this).children('.description').contents();
      const province = vietnameseSlugify(
        $(description[1]).text().trim().toLowerCase(),
      );
      const date = $(description[3]).text().trim();
      const issuedAt = moment(date, 'DD/MM/YYYY').toDate();
      company.issuedAt = issuedAt;

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
        company.id = CrawlerService.parseCompanyIdFromTaxCode(company.taxCode);
        company.address = $(this).children('p:nth-of-type(3)').text().trim();
        companies = [...companies, company];
      } else {
        console.log('Failed to parse company info', info);
      }
    });
    try {
      await this.companyRepository.delete({
        id: In(companies.map((c) => c.id)),
      });
      await this.companyRepository.save(companies);
    } catch (error) {
      console.error(`Error saving companies`, error);
    }
    return companies;
  }

  public async syncAddress() {
    const count = await this.companyRepository.count();
    for (let i = 0; i < count; i += 300) {
      const companies = await this.companyRepository.find({
        take: 300,
        skip: i,
      });
      for (const company of companies) {
        company.address = company.address.replace(/Địa chỉ:\s+/, '');
      }
      await this.companyRepository.save(companies);
    }
  }
}
