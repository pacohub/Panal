import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonData } from './entities/person-data.entity';
import { CreatePersonDataDto } from './dto/create-person-data.dto';
import { UpdatePersonDataDto } from './dto/update-person-data.dto';

@Injectable()
export class PersonDataService {
  constructor(
    @InjectRepository(PersonData)
    private personDataRepository: Repository<PersonData>,
  ) {}

  async findAll(): Promise<PersonData[]> {
    return this.personDataRepository.find({
      relations: ['person', 'dataType'],
    });
  }

  async findByPersonId(personId: number): Promise<PersonData[]> {
    return this.personDataRepository.find({
      where: { personId },
      relations: ['dataType'],
    });
  }

  async findOne(id: number): Promise<PersonData> {
    const personData = await this.personDataRepository.findOne({
      where: { id },
      relations: ['person', 'dataType'],
    });
    if (!personData) {
      throw new NotFoundException(`No se encontró dato de persona con el ID ${id}`);
    }
    return personData;
  }

  async create(createPersonDataDto: CreatePersonDataDto): Promise<PersonData> {
    const personData = this.personDataRepository.create(createPersonDataDto);
    return this.personDataRepository.save(personData);
  }

  async update(id: number, updatePersonDataDto: UpdatePersonDataDto): Promise<PersonData> {
    const personData = await this.personDataRepository.preload({
      id,
      ...updatePersonDataDto,
    });

    if (!personData) {
      throw new NotFoundException(`No se encontró dato de persona con el ID ${id}`);
    }

    return this.personDataRepository.save(personData);
  }

  async remove(id: number): Promise<void> {
    const result = await this.personDataRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`No se encontró dato de persona con el ID ${id}`);
    }
  }

  async removeByPersonId(personId: number): Promise<void> {
    await this.personDataRepository.delete({ personId });
  }
} 