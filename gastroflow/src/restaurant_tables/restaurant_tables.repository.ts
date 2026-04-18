import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RestaurantTables } from "./entities/restaurant_table.entity";
import { Repository } from "typeorm";
import { RestaurantTableStatus } from "../common/restaurant_table.enum";
import { Restaurant } from "../restaurants/entities/restaurant.entity";

export const tablesSeed = [
  { table_number: 1, capacity: 2, zone: 'Interior' },
  { table_number: 2, capacity: 2, zone: 'Interior' },
  { table_number: 3, capacity: 4, zone: 'Interior' },
  { table_number: 4, capacity: 4, zone: 'Interior' },
  { table_number: 5, capacity: 4, zone: 'Terraza' },
  { table_number: 6, capacity: 6, zone: 'Terraza' },
  { table_number: 7, capacity: 6, zone: 'Terraza' },
  { table_number: 8, capacity: 8, zone: 'Salón privado' },
  { table_number: 9, capacity: 8, zone: 'Salón privado' },
  { table_number: 10, capacity: 10, zone: 'Salón privado' },
];

@Injectable()

export class RestaurantTablesRepository{
    constructor(
    @InjectRepository(RestaurantTables) private restaurantsTablesRepository: Repository<RestaurantTables>,
    @InjectRepository(Restaurant) private restaurantsRepository: Repository<Restaurant>, 
){}
    async getAvailableTables(restaurantId: string) {
    const tables = await this.restaurantsTablesRepository.find({
        where: {
        restaurant: { id: restaurantId },
        },
    });

    if (!tables.length) throw new NotFoundException('No se encontraron mesas para este restaurante');

    return tables;
    }

    async updateStatus(restaurantId: string, tableId: string, status: RestaurantTableStatus) {
    const table = await this.restaurantsTablesRepository.findOne({
    where: {
      id: tableId,
      restaurant: { id: restaurantId },
    },
    });

    if (!table) throw new NotFoundException('Mesa no encontrada');
    if (!table.is_active) throw new BadRequestException('La mesa no está activa');
    if (table.status === status) throw new BadRequestException(`La mesa ya está en estado ${status}`);

    table.status = status;
    return this.restaurantsTablesRepository.save(table);
    }

    
async seedTables(restaurantId: string) {
  const restaurant = await this.restaurantsRepository.findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

  const existingTables = await this.restaurantsTablesRepository.count({
    where: { restaurant: { id: restaurantId } },
  });

  if (existingTables > 0) throw new BadRequestException('El restaurante ya tiene mesas cargadas');

  const tables = tablesSeed.map((table) =>
    this.restaurantsTablesRepository.create({
      ...table,
      restaurant,
    }),
    );

    return this.restaurantsTablesRepository.save(tables);
    }



}