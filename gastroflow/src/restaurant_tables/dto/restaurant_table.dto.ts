import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTableDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  table_number!: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacity!: number;

  @ApiProperty({ example: 'Terraza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  zone!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;
}
