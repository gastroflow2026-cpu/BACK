import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionPayment } from "./entities/subscription_payment.entity";
import { SubscriptionsPaymentController } from "./subscription_payment.controller";
import { SubscriptionsPaymentService } from "./subscription_payment.service";
import { Subscription } from "../subscriptions/entities/subscription.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SubscriptionPayment, Subscription])]  ,
    controllers: [SubscriptionsPaymentController],
    providers: [SubscriptionsPaymentService]
})

export class SubscriptionPaymentModule{

}