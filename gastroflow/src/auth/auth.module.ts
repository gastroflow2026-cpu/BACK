import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import googleOauthConfig from '../config/google-oauth.config';
import { GoogleStrategy } from '../strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { UsersRepository } from '../users/user.repository';
import { GoogleLoginGuard } from './guards/google-auth/google.login.guard';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { GoogleRegisterGuard } from './guards/google-auth/google.register.guard';
import { MailModule } from '../mail/mail.module';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User, Restaurant]),
    ConfigModule.forFeature(googleOauthConfig),
    UsersModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    UsersRepository,
    GoogleLoginGuard,
    GoogleAuthGuard,
    GoogleRegisterGuard,
  ],
  exports: [AuthService, UsersRepository],
})
export class AuthModule {}
