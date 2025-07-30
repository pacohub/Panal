import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { DataType } from './entities/data-type.entity';
import { PersonData } from './entities/person-data.entity';
import { PersonService } from './person.service';
import { DataTypeService } from './data-type.service';
import { PersonDataService } from './person-data.service';
import { PersonController } from './person.controller';
import { DataTypeController } from './data-type.controller';
import { PersonDataController } from './person-data.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Person, DataType, PersonData])],
  controllers: [PersonController, DataTypeController, PersonDataController],
  providers: [PersonService, DataTypeService, PersonDataService],
})
export class PersonModule {}
