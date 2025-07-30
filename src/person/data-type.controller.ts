import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DataTypeService } from './data-type.service';
import { CreateDataTypeDto } from './dto/create-data-type.dto';
import { UpdateDataTypeDto } from './dto/update-data-type.dto';
import { DataType } from './entities/data-type.entity';

@Controller('data-type')
export class DataTypeController {
  constructor(private readonly dataTypeService: DataTypeService) {}

  @Get()
  findAll(): Promise<DataType[]> {
    return this.dataTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DataType> {
    return this.dataTypeService.findOne(id);
  }

  @Post()
  create(@Body() createDataTypeDto: CreateDataTypeDto): Promise<DataType> {
    return this.dataTypeService.create(createDataTypeDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDataTypeDto: UpdateDataTypeDto,
  ): Promise<DataType> {
    return this.dataTypeService.update(id, updateDataTypeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dataTypeService.remove(id);
  }
} 