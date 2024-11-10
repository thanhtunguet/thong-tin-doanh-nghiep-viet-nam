import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { Repository } from 'react3l';
import { Observable } from 'rxjs';
import { SOURCE_URL, STATIC_SOURCE_URL } from 'src/_config/dotenv';
import { httpConfig } from '../_config/repository';

@Injectable()
export class StaticRepository extends Repository {
  constructor() {
    super(httpConfig);
    this.baseURL = STATIC_SOURCE_URL;
  }

  public readonly crawlPage = (request: Request): Observable<AxiosResponse> => {
    return this.http.get(request.url, {
      responseType: 'blob',
      headers: {
        referer: new URL('/', SOURCE_URL).toString(),
        'Set-Ch-Ua':
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      },
    });
  };
}
