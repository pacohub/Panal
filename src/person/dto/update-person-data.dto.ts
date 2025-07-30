import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonDataDto } from './create-person-data.dto';
 
export class UpdatePersonDataDto extends PartialType(CreatePersonDataDto) {
  fileName?: string;
}