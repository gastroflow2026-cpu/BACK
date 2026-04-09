import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchPassword } from '../../decorators/matchPassword';

import { AuthProvider, UserRole } from '../../common/user.enums';
import { OmitType, PartialType, PickType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(20, { message: 'Maximo 20 caracteres' })
  first_name!: string;

  @IsString({ message: 'Apellido debe ser un string' })
  @IsNotEmpty({ message: 'Apellido no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(60, { message: 'Maximo 60 caracteres' })
  @IsString()
  last_name!: string;

  @IsNotEmpty({ message: 'Email no puede ser vacio' })
  @IsEmail()
  @IsString()
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
  password!: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['password'])
  confirmPassword!: string;

  @IsUUID() //!Verificar cual va a ser el identificador con el que se va a asociar user y el restaurante
  @IsNotEmpty()
  restaurant_id!: string;

  @IsNotEmpty()//! Verificar quien va a definir rol
  @IsEnum(UserRole)
  role!: UserRole;

  @IsNotEmpty()
  @IsEnum(AuthProvider)
  auth_provider!: AuthProvider;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'confirmPassword', 'role', 'auth_provider']),
) {}

export class LoginUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
]) {}


