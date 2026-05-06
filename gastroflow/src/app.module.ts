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
import { MailModule } from './mail/mail.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReservationsPaymentModule } from './reservations-payment/reservations-payment.module';
import { RestaurantTablesModule } from './restaurant_tables/restaurant_tables.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notification/notification.module';
import { OrderModule } from './orders/order.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionPaymentModule } from './subscriptions_payments/subscription_payment.module';
import { RestaurantVerificationModule } from './restaurant-verification/restaurant-verification.module';
import { PlatformModule } from './plataform/platform.module';
import { ChatModule } from './chat/chat.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { AdminChatModule } from './admin-chat/admin-chat.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    PlatformModule,
    RestaurantVerificationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [typeOrmConfig, googleOauthConfig],
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) =>
        ConfigService.get('typeorm')!,
    }),
    UsersModule,
    AuthModule,
    ChatModule,
    AdminChatModule,
    FileUploadModule,
    MenuModule,
    RestaurantModule,
    MailModule,
    RestaurantTablesModule,
    ReservationsModule,
    ReservationsPaymentModule,
    SubscriptionsModule,
    SubscriptionPaymentModule,
    NotificationsModule,
    OrderModule,
    CashRegisterModule,
    MetricsModule,
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
