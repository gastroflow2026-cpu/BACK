import { Module } from "@nestjs/common";
import { Restaurant } from "./restaurant.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantController } from "./restaurant.controller";
import { RestaurantService } from "./restaurant.service";
import { RestaurantTheme } from "../../restaurant-theme/entities/restaurant-theme.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, RestaurantTheme])],
    exports: [TypeOrmModule],
    controllers: [RestaurantController],
    providers: [RestaurantService]
})
export class RestauratModule {}
