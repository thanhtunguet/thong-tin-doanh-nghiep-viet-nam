import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MQTT_URL } from 'src/_config/dotenv';
import { InfoRepository } from 'src/_repositories/info-repository';
import { Business, Company, Province, ProvinceGroup } from '../_entities';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

export const MQTT_SERVICE = 'MQTT_SERVICE';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Business, ProvinceGroup, Province]),
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
  controllers: [CrawlerController],
  exports: [CrawlerService, InfoRepository, MQTT_SERVICE],
})
export class CrawlerModule {}
