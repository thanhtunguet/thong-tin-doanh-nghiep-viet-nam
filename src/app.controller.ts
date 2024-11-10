import { Controller, Get, Next, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AxiosResponse } from 'axios';
import { NextFunction, Request, Response } from 'express';
import { WEB_URL } from './_config/dotenv';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('*')
  public async proxyAll(
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ) {
    if (request.url.startsWith('/api')) {
      next();
      return;
    }
    const host = request.hostname;
    if (host.startsWith('static')) {
      response.set('Cache-Control', 'no-cache');
      response.set('Access-Control-Allow-Origin', WEB_URL);
      response.set(
        'Access-Control-Allow-Methods',
        'GET,POST,OPTIONS,HEAD,PUT,PATCH',
      );
      response.set('Access-Control-Allow-Credentials', 'true');

      if (request.method === 'OPTIONS') {
        response.status(200).send();
        return;
      }

      const staticResponse: AxiosResponse =
        await this.appService.proxyStaticSite(request);

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

      response.status(staticResponse.status).end(staticResponse.data);

      return;
    }
    const html = await this.appService.proxyMainSite(request.url);
    response.status(200).send(html);
  }
}
