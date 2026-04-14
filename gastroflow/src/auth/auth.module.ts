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

@Module({
  imports: [
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([User]),
    ConfigModule.forFeature(googleOauthConfig),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, UsersRepository],
  exports: [AuthService, UsersRepository]
})
export class AuthModule {}
