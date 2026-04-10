import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from '../users/dto/user.dto';
import { UsersRepository } from '../users/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService, // para uso del SIGNIN
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
      password_hash: hashedPassword,
      });
    }

    async signIn(email: string, password: string){
      const dbUser = await this.usersRepository.getUserByEmail(email);
      if(!dbUser) throw new NotFoundException('Email o passwords incorrectos');
      const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
      if(!isPasswordValid) throw new BadRequestException('Email o passwords incorrectos');
      const userPayload = {
          id: dbUser.id,
          name: dbUser.first_name,
          email: dbUser.email,
      }
      const token = this.jwtService.sign(userPayload, {
        expiresIn: '1h'
        });
      
      return {success: 'Usuario Logueado', token, 
        user: {
          id: dbUser.id,
          name: dbUser.first_name,
          email: dbUser.email,
        }}
    }
}
