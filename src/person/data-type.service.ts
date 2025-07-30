import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataType } from './entities/data-type.entity';
import { CreateDataTypeDto } from './dto/create-data-type.dto';
import { UpdateDataTypeDto } from './dto/update-data-type.dto';

@Injectable()
export class DataTypeService {
  constructor(
    @InjectRepository(DataType)
    private dataTypeRepository: Repository<DataType>,
  ) {}

  async findAll(): Promise<DataType[]> {
    return this.dataTypeRepository.find({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<DataType> {
    const dataType = await this.dataTypeRepository.findOneBy({ id });
    if (!dataType) {
      throw new NotFoundException(`No se encontró tipo de dato con el ID ${id}`);
    }
    return dataType;
  }

  async create(createDataTypeDto: CreateDataTypeDto): Promise<DataType> {
    const dataType = this.dataTypeRepository.create(createDataTypeDto);
    return this.dataTypeRepository.save(dataType);
  }

  async update(id: number, updateDataTypeDto: UpdateDataTypeDto): Promise<DataType> {
    const dataType = await this.dataTypeRepository.preload({
      id,
      ...updateDataTypeDto,
    });

    if (!dataType) {
      throw new NotFoundException(`No se encontró tipo de dato con el ID ${id}`);
    }

    return this.dataTypeRepository.save(dataType);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`No se encontró tipo de dato con el ID ${id}`);
    }
  }
} 