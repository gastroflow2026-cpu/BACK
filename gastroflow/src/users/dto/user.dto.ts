import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchPassword } from '../../decorators/matchPassword';
import { AuthProvider, UserRole } from '../../common/user.enums';
import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateUserDto {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(20, { message: 'Maximo 20 caracteres' })
  @ApiProperty({
    description: 'Debe ser un string de entre 3 y 20 caracteres',
    example: 'test_first_name',
  })
  first_name!: string;

  @IsString({ message: 'Apellido debe ser un string' })
  @IsNotEmpty({ message: 'Apellido no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(60, { message: 'Maximo 60 caracteres' })
  @IsString()
  @ApiProperty({
    description: 'Debe ser un string de entre 3 y 60 caracteres',
    example: 'test_last_name',
  })
  last_name!: string;

  @IsNotEmpty({ message: 'Email no puede ser vacio' })
  @IsEmail()
  @IsString()
  @ApiProperty({
    description: 'Debe ser un email válido',
    example: 'TestUser01@mail.com',
  })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password no puede estar vacio' })
  @MinLength(8)
  @MaxLength(15)
  @IsStrongPassword(
    {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Contraseña con al  menos una mayuscula, una minuscula, un numero y un caracater especial',
    },
  )
  @IsString()
  @ApiProperty({
    description:
      'Debe tener mínimo una mayúscula, un número, un caracter especial y una minúscula',
    example: 'Testpassword01!',
  })
  password!: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['password'])
  @ApiProperty({
    description:
      'Debe tener mínimo una mayúscula, un número, un caracter especial y una minúscula',
    example: 'Testpassword01!',
  })
  confirmPassword!: string;

  @ApiHideProperty()
  @IsUUID() //!Verificar cual va a ser el identificador con el que se va a asociar user y el restaurante
  @IsEmpty()
  restaurant_id!: string;

  @ApiHideProperty()
  @IsEmpty() //! Verificar quien va a definir rol
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiHideProperty()
  @IsEmpty()
  @IsEnum(AuthProvider)
  auth_provider!: AuthProvider;

  @IsString()
  @IsNotEmpty({ message: 'City no puede estar vacio' })
  @MinLength(2)
  @MaxLength(15)
  @ApiProperty({
    description: 'Ciudad del usuario',
    example: 'Santiago',
  })
  city!: string;

  @IsString()
  @IsNotEmpty({ message: 'Country no puede estar vacio' })
  @MinLength(2)
  @MaxLength(15)
  @ApiProperty({
    description: 'País del usuario',
    example: 'Chile',
  })
  country!: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'confirmPassword', 'role', 'auth_provider']),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  imgUrl?: string;

}

export class LoginUserDto {
  @IsNotEmpty({ message: 'Email no puede ser vacio' })
  @IsEmail()
  @IsString()
  @ApiProperty({
    description: 'Debe ser un email válido',
    example: 'TestUser01@mail.com',
  })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password no puede estar vacio' })
  @MinLength(8)
  @MaxLength(15)
  @IsStrongPassword(
    {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Contraseña con al  menos una mayuscula, una minuscula, un numero y un caracater especial',
    },
  )
  @IsString()
  @ApiProperty({
    description:
      'Debe tener mínimo una mayúscula, un número, un caracter especial y una minúscula',
    example: 'Testpassword01!',
  })
  password!: string;

}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class ResetPasswordDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(15)
  @IsStrongPassword({
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @ApiProperty({ example: 'NewPassword01!' })
  newPassword!: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['newPassword'])
  @ApiProperty({ example: 'NewPassword01!' })
  confirmNewPassword!: string;
}

export class CreateEmployeeDto {
  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsUUID()
  restaurant_id!: string;
}
export class RequestPasswordResetDto {
  @IsEmail()
  @ApiProperty({ example: 'usuario@mail.com' })
  email!: string;
}
export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'uuid-del-token' })
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(15)
  @IsStrongPassword({ minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
  @ApiProperty({ example: 'NewPassword01!' })
  newPassword!: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['newPassword'])
  @ApiProperty({ example: 'NewPassword01!' })
  confirmNewPassword!: string;
}


