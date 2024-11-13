import { Controller, Get, Next, Param, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { WEB_URL } from './_config/dotenv';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly crawlerService: CrawlerService,
  ) {}

  @Get('/:page.html')
  public async proxyInfoPage(
    @Param('page') page: string,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next);
  }

  @Get('/thong-tin/:company.html')
  public async proxyCompany(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      this.crawlerService.crawlCompany(html);
    });
  }

  @Get('/:province')
  public async proxyProvince(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/trang-:page/')
  public async proxyProvincePage(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/:district')
  public async proxyDistrict(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/:district/trang-:page/')
  public async proxyDistrictPage(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  private enableCors(response: Response) {
    response.set('Cache-Control', 'no-cache');
    response.set('Access-Control-Allow-Origin', WEB_URL);
    response.set(
      'Access-Control-Allow-Methods',
      'GET,POST,OPTIONS,HEAD,PUT,PATCH',
    );
    response.set('Access-Control-Allow-Credentials', 'true');
  }

  private handleStaticHeadersFromAxiosResponse(
    response: Response,
    staticResponse: AxiosResponse,
  ) {
    if (
      typeof staticResponse.headers === 'object' &&
      staticResponse.headers != null
    ) {
      const headerEntries = Object.entries(staticResponse.headers);
      for (const entry of headerEntries) {
        const [key, value] = entry;
        if (key.toLowerCase() === 'vary') {
          response.set('Vary', 'Accept-Encoding');
          continue;
        }
        if (
          [
            'content-type',
            'content-length',
            'content-disposition',
            'cache-control',
            'set-cookie',
            'nel',
            'report-to',
            'server-timing',
            'expires',
            'date',
            'etag',
            'last-modified',
            'cf-ray',
            'cf-cache-status',
            'accept-ranges',
            'alt-svc',
            'age',
          ].includes(key.toLowerCase())
        ) {
          if (value instanceof Array) {
            for (const subValue of value) {
              response.set(key, subValue);
            }
            continue;
          }
          response.set(key, value?.toString());
        }
      }
    }
  }

  @Get('*')
  public async proxyAll(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
    mainCallback?: (html: string) => void,
  ) {
    if (request.url.startsWith('/api')) {
      next();
      return;
    }
    const host = request.hostname;

    if (host.startsWith('static')) {
      this.enableCors(response);

      if (request.method.toUpperCase() === 'OPTIONS') {
        response.status(200).send();
        return;
      }

      const staticResponse: AxiosResponse =
        await this.appService.proxyStaticSite(request);

      this.handleStaticHeadersFromAxiosResponse(response, staticResponse);

      response.status(staticResponse.status).end(staticResponse.data);
      return;
    }

    const html = await this.appService.proxyMainSite(request.url);

    if (typeof mainCallback === 'function' && mainCallback != null) {
      console.log(request.url);
      mainCallback(html);
    }

    response.status(200).end(html);
  }
}
