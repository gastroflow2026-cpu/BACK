import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/user.dto';
import { UsersRepository } from '../users/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
    private readonly usersRepository: UsersRepository,
   // private readonly jwtService: JwtService, // para uso del SIGNIN
  ) {}


    async signUp(newUserData: CreateUserDto) {
    const { email, password } = newUserData;

    if (!email || !password) {
      throw new BadRequestException('Email y Password son requeridos');
    }

    const foundUser = await this.usersRepository.getUserByEmail(email);
    if (foundUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.usersRepository.createUser({
      ...newUserData,
      password: hashedPassword,
      });
    }
}
