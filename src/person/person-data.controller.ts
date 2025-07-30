import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PersonDataService } from './person-data.service';
import { CreatePersonDataDto } from './dto/create-person-data.dto';
import { UpdatePersonDataDto } from './dto/update-person-data.dto';
import { PersonData } from './entities/person-data.entity';

@Controller('person-data')
export class PersonDataController {
  constructor(private readonly personDataService: PersonDataService) {}

  @Get()
  findAll(): Promise<PersonData[]> {
    return this.personDataService.findAll();
  }

  @Get('person/:personId')
  findByPersonId(@Param('personId', ParseIntPipe) personId: number): Promise<PersonData[]> {
    return this.personDataService.findByPersonId(personId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PersonData> {
    return this.personDataService.findOne(id);
  }

  @Post()
  create(@Body() createPersonDataDto: CreatePersonDataDto): Promise<PersonData> {
    return this.personDataService.create(createPersonDataDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonDataDto: UpdatePersonDataDto,
  ): Promise<PersonData> {
    return this.personDataService.update(id, updatePersonDataDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.personDataService.remove(id);
  }
} 