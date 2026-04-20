import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/user.dto';
import { UsersRepository } from '../users/user.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthProvider, UserRole } from '../common/user.enums';
import { User } from '../users/entities/user.entity';
import { CreateGoogleUserDto } from '../users/dto/CreateGoogleUserDto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

    const createdUser = await this.usersRepository.createUser({
      ...newUserData,
      password_hash: hashedPassword,
    });

    const savedUser = await this.usersRepository.getUserByEmail(email);

    if (savedUser) {
      try {
        await this.mailService.sendWelcomeEmail(
          savedUser.email,
          savedUser.first_name,
        );
      } catch (error) {
        console.error(
          'Usuario creado, pero falló el correo de bienvenida',
          error,
        );
      }
    }

    return createdUser;
  }

  async signIn(email: string, password: string) {
    const dbUser = await this.usersRepository.getUserByEmail(email);
    if (!dbUser) throw new NotFoundException('Email o passwords incorrectos');
    if (dbUser.auth_provider === AuthProvider.GOOGLE_AUTH) {
      throw new BadRequestException(
        'Este correo fue registrado con Google. Iniciá sesión con Google',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      dbUser.password_hash,
    );
    if (!isPasswordValid)
      throw new BadRequestException('Email o passwords incorrectos');

    const payLoad = {
      id: dbUser.id,
      name: dbUser.first_name,
      email: dbUser.email,
      roles: this.assignRoles(dbUser),
      auth_provider: dbUser.auth_provider,
    };
    const token = this.jwtService.sign(payLoad, {
      expiresIn: '1h',
    });

    return {
      success: 'Usuario Logueado',
      token: token,
      user: {
        id: dbUser.id,
        name: dbUser.first_name,
        email: dbUser.email,
        roles: this.assignRoles(dbUser),
        auth_provider: dbUser.auth_provider,
      },
    };
  }

  loginWithProvider(user: User) {
    const payload = {
      id: user.id,
      name: user.first_name,
      email: user.email,
      roles: this.assignRoles(user),
      auth_provider: user.auth_provider,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    return {
      success: 'Usuario Logueado',
      token,
      user: {
        id: user.id,
        name: user.first_name,
        email: user.email,
        roles: this.assignRoles(user),
        auth_provider: user.auth_provider,
        imgUrl: user.imgUrl,
      },
    };
  }

  async validateGoogleUser(
    googleUser: CreateGoogleUserDto,
    intent: 'login' | 'register' = 'login',
  ): Promise<User> {
    const normalizedEmail = googleUser.email.trim().toLowerCase();

    const existingUser =
      await this.usersRepository.getUserByEmail(normalizedEmail);

    console.log('[AuthService.validateGoogleUser]', {
      normalizedEmail,
      intent,
      found: !!existingUser,
      auth_provider: existingUser?.auth_provider,
    });

    if (existingUser) {
      if (existingUser.auth_provider !== AuthProvider.GOOGLE_AUTH) {
        throw new BadRequestException('provider_conflict');
      }

      if (intent === 'register') {
        throw new BadRequestException('google_account_exists');
      }

      return existingUser;
    }

    await this.usersRepository.createUser({
      ...googleUser,
      email: normalizedEmail,
      auth_provider: AuthProvider.GOOGLE_AUTH,
    });

    const createdUser = await this.usersRepository.getUserByEmail(
      googleUser.email,
    );

    if (!createdUser) {
      throw new UnauthorizedException('No se pudo crear el usuario de Google');
    }

    return createdUser;
  }

  private assignRoles(user: User): UserRole[] {
    const roles: UserRole[] = [user.role];

    // SUPER_ADMIN tiene todos los permisos
    if (user.role === UserRole.SUPER_ADMIN) {
      return [
        UserRole.SUPER_ADMIN,
        UserRole.REST_ADMIN,
        UserRole.WAITER,
        UserRole.CHEF,
        UserRole.CASHIER,
        UserRole.CUSTOMER,
      ];
    }

    // REST_ADMIN puede actuar como admin, waiter y customer
    if (user.role === UserRole.REST_ADMIN) {
      roles.push(UserRole.WAITER, UserRole.CUSTOMER);
    }

    // CHEF puede actuar como waiter y customer
    if (user.role === UserRole.CHEF) {
      roles.push(UserRole.CUSTOMER);
    }

    // WAITER puede actuar como customer
    if (user.role === UserRole.WAITER) {
      roles.push(UserRole.CUSTOMER);
    }

    // CASHIER puede actuar como customer
    if (user.role === UserRole.CASHIER) {
      roles.push(UserRole.CUSTOMER);
    }

    return roles;
  }
}
