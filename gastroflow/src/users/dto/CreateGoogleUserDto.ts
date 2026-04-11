import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateGoogleUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @ApiProperty()
  first_name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @ApiProperty()
  last_name!: string;

  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @ApiProperty({ required: false })
  imgUrl?: string;
}
