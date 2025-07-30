import { PartialType } from '@nestjs/mapped-types';
import { CreateDataTypeDto } from './create-data-type.dto';
 
export class UpdateDataTypeDto extends PartialType(CreateDataTypeDto) {} 