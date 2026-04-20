import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './config/typeorm';
import googleOauthConfig from './config/google-oauth.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { FileUploadModule } from './file-upload/file-upload.module';
import { RestaurantModule } from './restaurants/restaurant.module';
import { MenuModule } from './menu/menu.module';
import { RestaurantTablesModule } from './restaurant_tables/restaurant_tables.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReservationsPaymentModule } from './reservations-payment/reservations-payment.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [typeOrmConfig, googleOauthConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) =>
        ConfigService.get('typeorm')!,
    }),
    UsersModule,
    AuthModule,
    FileUploadModule,
    MenuModule,
    RestaurantModule,
    RestaurantTablesModule,
    ReservationsModule,
    SubscriptionsModule,
    NotificationsModule,
    JwtModule.register({
      global: true,
      signOptions: { expiresIn: '60m' },
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
