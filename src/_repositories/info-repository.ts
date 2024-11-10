import { Injectable } from '@nestjs/common';
import { Repository } from 'react3l';
import { SOURCE_URL } from 'src/_config/dotenv';
import { httpConfig } from '../_config/repository';

@Injectable()
export class InfoRepository extends Repository {
  constructor() {
    super(httpConfig);
    this.baseURL = SOURCE_URL;
  }

  public readonly company = (companyURL: string) => {
    console.log(`/thong-tin/${companyURL}.html`);
    return this.http
      .get(`/thong-tin/${companyURL}.html`)
      .pipe(Repository.responseDataMapper<string>());
  };

  public readonly province = (province: string, page = 1) => {
    const url: string = page > 1 ? `/trang-${page}/` : '/';
    return this.http
      .get(`/${province}${url}`)
      .pipe(Repository.responseDataMapper<string>());
  };

  public readonly district = (province: string, district: string, page = 1) => {
    const pagePath = page > 1 ? `/trang-${page}/` : '/';
    return this.http
      .get(`/${province}/${district}${pagePath}`)
      .pipe(Repository.responseDataMapper<string>());
  };

  public readonly index = () => {
    return this.http.get(`/`).pipe(Repository.responseDataMapper<string>());
  };

  public readonly favicon = () => {
    return this.http
      .get(`/favicon.ico`)
      .pipe(Repository.responseDataMapper<string>());
  };

  public readonly crawlPage = (url: string) => {
    return this.http.get(url).pipe(Repository.responseDataMapper<string>());
  };
}
