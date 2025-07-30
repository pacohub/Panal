import { IsString, IsNumber } from 'class-validator';

export class CreatePersonDataDto {
  @IsNumber()
  personId: number;

  @IsNumber()
  dataTypeId: number;

  @IsString()
  value: string;

  @IsString()
  fileName?: string;
} 