import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm';
import googleOauthConfig from './config/google-oauth.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: ['.env.development', '.env'],
    load: [typeOrmConfig, googleOauthConfig]
  }),
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (ConfigService: ConfigService) => ConfigService.get('typeorm')!,
  }), UsersModule, AuthModule, 
  
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
