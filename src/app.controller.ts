import { Controller, Get, Next, Param, Req, Res } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { WEB_URL } from './_config/dotenv';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';

@ApiTags('App')
@Controller()
export class AppController {
  private readonly enableCors = (response: Response) => {
    response.set('Cache-Control', 'no-cache');
    response.set('Access-Control-Allow-Origin', WEB_URL);
    response.set(
      'Access-Control-Allow-Methods',
      'GET,POST,OPTIONS,HEAD,PUT,PATCH',
    );
    response.set('Access-Control-Allow-Credentials', 'true');
  };

  private readonly handleStaticHeadersFromAxiosResponse = (
    response: Response,
    staticResponse: AxiosResponse,
  ) => {
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
  };

  constructor(
    private readonly appService: AppService,
    private readonly crawlerService: CrawlerService,
  ) {}

  @Get('/:page.html')
  @ApiProduces('text/html')
  public async proxyInfoPage(
    @Param('page') page: string,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next);
  }

  @Get('/thong-tin/:company.html')
  @ApiProduces('text/html')
  public async proxyCompany(
    @Param('company') company: string,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      this.crawlerService.crawlCompany(html);
    });
  }

  @Get('/:province')
  @ApiProduces('text/html')
  public async proxyProvince(
    @Param('province') province: string,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/trang-:page/')
  @ApiProduces('text/html')
  public async proxyProvincePage(
    @Param('province') province: string,
    @Param('page') page: number,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/:district/')
  @ApiProduces('text/html')
  public async proxyDistrict(
    @Param('province') province: string,
    @Param('district') district: string,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
  }

  @Get('/:province/:district/trang-:page/')
  @ApiProduces('text/html')
  public async proxyDistrictPage(
    @Param('province') province: string,
    @Param('district') district: string,
    @Param('page') page: number,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    return this.proxyAll(request, response, next, (html: string) => {
      return this.crawlerService.crawlPage(html);
    });
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

    if (request.path === '/') {
      this.crawlerService.crawlPage(html);
    }

    if (typeof mainCallback === 'function' && mainCallback != null) {
      console.log(request.url);
      mainCallback(html);
    }

    response.status(200).end(html);
  }
}
