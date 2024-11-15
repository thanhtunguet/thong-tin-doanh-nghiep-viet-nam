import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MQTT_URL } from 'src/_config/dotenv';
import { TextPlainMiddleware } from 'src/_middlewares/text-plain/text-plain.middleware';
import { InfoRepository } from 'src/_repositories/info-repository';
import {
  Business,
  Company,
  CompanyBusinessMapping,
  Province,
  ProvinceGroup,
} from '../_entities';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { RawController } from './raw.controller';

export const MQTT_SERVICE = 'MQTT_SERVICE';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Business,
      ProvinceGroup,
      Province,
      CompanyBusinessMapping,
    ]),
  ],
  providers: [
    CrawlerService,
    InfoRepository,
    {
      provide: MQTT_SERVICE,
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: MQTT_URL,
          },
        });
      },
    },
  ],
  controllers: [CrawlerController, RawController],
  exports: [CrawlerService, InfoRepository, MQTT_SERVICE],
})
export class CrawlerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TextPlainMiddleware).forRoutes({
      path: '/api/crawler/from-html/',
      method: RequestMethod.ALL,
    });
  }
}
