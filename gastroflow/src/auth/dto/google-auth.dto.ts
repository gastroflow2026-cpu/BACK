import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString({ message: 'La credencial de Google debe ser un string' })
  @IsNotEmpty({ message: 'La credencial de Google no puede estar vacia' })
  credential!: string;
}
