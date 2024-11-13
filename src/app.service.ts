import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { InfoRepository } from 'src/_repositories/info-repository';
import { StaticRepository } from './_repositories/static-repository';

@Injectable()
export class AppService {
  public constructor(
    private readonly infoRepository: InfoRepository,
    private readonly staticRepository: StaticRepository,
  ) {}

  public async proxyMainSite(url: string) {
    const response = await firstValueFrom(this.infoRepository.crawlPage(url));
    return response;
  }

  public async proxyStaticSite(request: Request): Promise<AxiosResponse> {
    const response = await firstValueFrom(
      this.staticRepository.crawlPage(request),
    );
    return response;
  }
}
