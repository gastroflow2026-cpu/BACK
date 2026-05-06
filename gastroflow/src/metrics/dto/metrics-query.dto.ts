import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum MetricsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class MetricsQueryDto {
  @ApiPropertyOptional({ enum: MetricsPeriod, default: MetricsPeriod.DAY })
  @IsEnum(MetricsPeriod)
  @IsOptional()
  period?: MetricsPeriod = MetricsPeriod.DAY;

  @ApiPropertyOptional({ description: 'Fecha de referencia YYYY-MM-DD' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
