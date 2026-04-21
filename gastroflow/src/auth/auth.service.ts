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
import {
  OwnerRestaurantOnboardingDto,
  RegisterRestaurantOwnerDto,
} from './dto/owner-auth.dto';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async signUp(newUserData: CreateUserDto) {
    const { email, password } = newUserData;

    if (!email || !password) {
      throw new BadRequestException('Email y Password son requeridos');
    }

    const foundUser = await this.usersRepository.getUserByEmail(email);
    if (foundUser) {
      throw new BadRequestException('El email ya esta registrado');
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
        'Este correo fue registrado con Google. Inicia sesion con Google',
      );
    }
    if (dbUser.role === UserRole.REST_ADMIN) {
      throw new UnauthorizedException(
        'Esta cuenta owner debe iniciar sesion desde el acceso para socios',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      dbUser.password_hash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Email o passwords incorrectos');
    }

    return this.buildAuthResponse(dbUser);
  }

  async loginWithProvider(user: User) {
    return this.buildAuthResponse(user);
  }

  async signUpRestaurantOwner(newOwnerData: RegisterRestaurantOwnerDto) {
    const { email, password, ...ownerData } = newOwnerData;

    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = await this.usersRepository.getUserByEmail(normalizedEmail);

    if (foundUser) {
      throw new BadRequestException('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const savedUser = await this.usersRepository.createUserEntity({
      ...ownerData,
      email: normalizedEmail,
      password_hash: hashedPassword,
      role: UserRole.REST_ADMIN,
      auth_provider: AuthProvider.LOCAL_AUTH,
    });

    return this.buildAuthResponse(savedUser);
  }

  async signInRestaurantOwner(email: string, password: string) {
    const dbUser = await this.usersRepository.getUserByEmail(email);
    if (!dbUser) {
      throw new NotFoundException('Email o passwords incorrectos');
    }
    if (dbUser.auth_provider === AuthProvider.GOOGLE_AUTH) {
      throw new BadRequestException(
        'Este correo fue registrado con Google. Inicia sesion con Google',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Email o passwords incorrectos');
    }

    if (dbUser.role !== UserRole.REST_ADMIN) {
      throw new UnauthorizedException(
        'Este usuario no tiene permisos de administrador del restaurante',
      );
    }

    return this.buildAuthResponse(dbUser);
  }

  async completeRestaurantOnboarding(
    userId: string,
    restaurantData: OwnerRestaurantOnboardingDto,
  ) {
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const restaurantRepository = manager.getRepository(Restaurant);
      const normalizedRestaurantEmail = restaurantData.email
        ?.trim()
        .toLowerCase();
      const normalizedRestaurantSlug = restaurantData.slug?.trim().toLowerCase();
      const restaurantName = restaurantData.name?.trim();

      const owner = await userRepository.findOneBy({ id: userId });
      if (!owner) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (owner.role !== UserRole.REST_ADMIN) {
        throw new UnauthorizedException(
          'Este usuario no tiene permisos de administrador del restaurante',
        );
      }

      if (owner.restaurant_id) {
        throw new BadRequestException(
          'El administrador ya tiene un restaurante vinculado',
        );
      }

      if (!restaurantName) {
        throw new BadRequestException(
          'El nombre del restaurante es requerido',
        );
      }

      if (normalizedRestaurantSlug) {
        const slugInUse = await restaurantRepository.findOneBy({
          slug: normalizedRestaurantSlug,
        });
        if (slugInUse) {
          throw new BadRequestException('El slug del restaurante ya esta en uso');
        }
      }

      if (normalizedRestaurantEmail) {
        const emailInUse = await restaurantRepository.findOneBy({
          email: normalizedRestaurantEmail,
        });
        if (emailInUse) {
          throw new BadRequestException(
            'El email del restaurante ya esta registrado',
          );
        }
      }

      const restaurant = restaurantRepository.create({
        ...restaurantData,
        name: restaurantName,
        slug: normalizedRestaurantSlug,
        email: normalizedRestaurantEmail,
        is_active: restaurantData.is_active ?? true,
      });

      const savedRestaurant = await restaurantRepository.save(restaurant);
      owner.restaurant_id = savedRestaurant.id;

      return await userRepository.save(owner);
    });

    return this.buildAuthResponse(savedUser);
  }

  async validateGoogleUser(
  googleUser: CreateGoogleUserDto,
  intent: 'login' | 'register' = 'login',
): Promise<{ user: User; isNewUser: boolean }> {
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

    return { user: existingUser, isNewUser: false };
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

  return { user: createdUser, isNewUser: true };  // <-- fix
}

  private assignRoles(user: User): UserRole[] {
    const roles: UserRole[] = [user.role];

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

    if (user.role === UserRole.REST_ADMIN) {
      roles.push(UserRole.WAITER, UserRole.CUSTOMER);
    }

    if (user.role === UserRole.CHEF) {
      roles.push(UserRole.CUSTOMER);
    }

    if (user.role === UserRole.WAITER) {
      roles.push(UserRole.CUSTOMER);
    }

    if (user.role === UserRole.CASHIER) {
      roles.push(UserRole.CUSTOMER);
    }

    return roles;
  }

  private buildAuthResponse(user: User) {
    const roles = this.assignRoles(user);
    const requiresRestaurantOnboarding = !user.restaurant_id;
    const payload = {
      id: user.id,
      name: user.first_name,
      email: user.email,
      roles,
      auth_provider: user.auth_provider,
      restaurant_id: user.restaurant_id ?? null,
      requires_restaurant_onboarding: requiresRestaurantOnboarding,
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
        roles,
        auth_provider: user.auth_provider,
        restaurant_id: user.restaurant_id ?? null,
        requires_restaurant_onboarding: requiresRestaurantOnboarding,
        imgUrl: user.imgUrl,
      },
    };
  }
}
