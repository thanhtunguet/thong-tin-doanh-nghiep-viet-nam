import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business, Company } from 'src/_entities';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Business])],
  providers: [CompanyService],
  controllers: [CompanyController],
})
export class CompanyModule {}
