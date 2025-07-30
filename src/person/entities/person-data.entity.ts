import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Person } from './person.entity';
import { DataType } from './data-type.entity';

@Entity()
export class PersonData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  personId: number;

  @Column()
  dataTypeId: number;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', nullable: true })
  fileName?: string;

  @ManyToOne(() => Person, person => person.personData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @ManyToOne(() => DataType, dataType => dataType.personData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataTypeId' })
  dataType: DataType;
} 