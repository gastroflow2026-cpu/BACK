import { Module } from "@nestjs/common";
import { Restaurant } from "./restaurant.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantController } from "./restaurant.controller";
import { RestaurantService } from "./restaurant.service";

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant])],
    exports: [TypeOrmModule],
    controllers: [RestaurantController],
    providers: [RestaurantService]
})
export class RestauratModule {}