import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PersonData } from './person-data.entity';

@Entity()
export class DataType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  type: 'text' | 'number' | 'date' | 'email' | 'url' | 'boolean';

  @Column({ default: false })
  required: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PersonData, personData => personData.dataType)
  personData: PersonData[];
} 