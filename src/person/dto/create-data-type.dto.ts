import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class CreateDataTypeDto {
  @IsString()
  name: string;

  @IsEnum(['text', 'number', 'date', 'email', 'url', 'boolean'])
  type: 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 