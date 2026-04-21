import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchPassword } from '../../decorators/matchPassword';
import { CreateRestaurantDto } from '../../restaurants/dto/restaurant.dto';

export class RegisterRestaurantOwnerDto {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(20, { message: 'Maximo 20 caracteres' })
  @ApiProperty({
    description: 'Nombre del dueno o administrador',
    example: 'Hiram',
  })
  first_name!: string;

  @IsString({ message: 'Apellido debe ser un string' })
  @IsNotEmpty({ message: 'Apellido no puede estar vacio' })
  @MinLength(3, { message: 'Minimo 3 caracteres' })
  @MaxLength(60, { message: 'Maximo 60 caracteres' })
  @ApiProperty({
    description: 'Apellido del dueno o administrador',
    example: 'Carreno',
  })
  last_name!: string;

  @IsNotEmpty({ message: 'Email no puede ser vacio' })
  @IsEmail()
  @IsString()
  @ApiProperty({
    description: 'Email del dueno o administrador',
    example: 'owner@restaurant.com',
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
        'Contrasena con al menos una mayuscula, una minuscula, un numero y un caracter especial',
    },
  )
  @ApiProperty({
    description:
      'Debe tener minimo una mayuscula, un numero, un caracter especial y una minuscula',
    example: 'Ownerpass01!',
  })
  password!: string;

  @IsNotEmpty()
  @Validate(MatchPassword, ['password'])
  @ApiProperty({
    description: 'Debe coincidir con password',
    example: 'Ownerpass01!',
  })
  confirmPassword!: string;
}

export class OwnerRestaurantOnboardingDto extends CreateRestaurantDto {}

export class OwnerAuthResponseDto {
  @ApiProperty({ example: 'Usuario Logueado' })
  success!: string;

  @ApiProperty({ example: 'jwt-token' })
  token!: string;

  @ApiProperty({
    example: {
      id: 'uuid',
      name: 'Hiram',
      email: 'owner@restaurant.com',
      roles: ['rest_admin', 'waiter', 'customer'],
      auth_provider: 'local_auth',
      restaurant_id: null,
      requires_restaurant_onboarding: true,
    },
  })
  user!: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    auth_provider: string;
    restaurant_id?: string | null;
    requires_restaurant_onboarding?: boolean;
  };
}
