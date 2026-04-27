import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { OrderStatus } from "../common/order.enum";
import { AddItemDto, UpdateOrderDto } from "./dto/order.dto";
import { MenuItem } from "../menu/entities/menu-item.entity";
import { User } from "../users/entities/user.entity";
import { RestaurantTables } from "../restaurant_tables/entities/restaurant_table.entity";
import { OrderItem } from "./entities/order_item";

@Injectable()

export class OrderService{
    
    constructor(
        @InjectRepository(Order) private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem) private ordersItemsRepository: Repository<OrderItem>,
        @InjectRepository(MenuItem) private menuItemsRepository: Repository<MenuItem>,
        @InjectRepository(User) private usersRepository: Repository<User>,
        @InjectRepository(RestaurantTables) private restaurantsTablesRepository: Repository<RestaurantTables>

    ){}

    async openOrder(tableId: string, waiterId: string){

        const waiter = await this.usersRepository.findOne({
            where: { id: waiterId },
            relations: ['restaurant'],
        });

        if (!waiter) {
            throw new NotFoundException('Mozo no encontrado');
        }

        const table = await this.restaurantsTablesRepository.findOne({
            where: { id: tableId },
            relations: ['restaurant'],
        });

        if (!table) {
            throw new NotFoundException('Mesa no encontrada');
        }

        if (table.restaurant.id !== waiter.restaurant.id) {
            throw new ForbiddenException(
            'La mesa no pertenece a tu restaurante'
            );
        }

        
        const existingOrder = await this.ordersRepository.findOne({
            where: {
                table: { id: tableId },
                isActive: true
            }, relations:['items', 'items.menuItem']
        });
        
        if (existingOrder) return existingOrder;
        
        const newOrder = this.ordersRepository.create({
            table: { id: tableId },
            restaurant: { id: waiter.restaurant.id },
            waiter: { id: waiterId },
            status: OrderStatus.OPEN,
            isActive: true,
        });
        
        return await this.ordersRepository.save(newOrder);
    }

    async addItemToOrder(orderId: string, orderItems: AddItemDto, waiterId: string) {
        const { menuItemId, quantity, notes } = orderItems;

        const order = await this.ordersRepository.findOne({
            where: { id: orderId, isActive: true },
            relations: ['waiter', 'restaurant'],
        });

        if (!order) {
            throw new NotFoundException('Orden no encontrada o cerrada');
        }

        if (order.waiter.id !== waiterId) {
            throw new ForbiddenException('Esta orden no te pertenece');
        }

        const menuItem = await this.menuItemsRepository.findOne({
            where: { id: menuItemId },
            relations: ['restaurant'],
        });

        if (!menuItem) {
            throw new NotFoundException('Producto no encontrado en el menú');
        }

        if (!menuItem.is_available) {
            throw new ForbiddenException('Producto no disponible');
            }
      
        const orderItem = this.ordersItemsRepository.create({
            order: { id: orderId } as any,
            menuItem: { id: menuItemId } as any,
            quantity: Number(quantity),
            unit_price: Number(menuItem.price),
            notes,
            });

        await this.ordersItemsRepository.save(orderItem);

        order.total += Number(menuItem.price) * Number(quantity);
        await this.ordersRepository.save(order);

        return await this.ordersRepository.findOne({
            where: { id: orderId },
            relations: ['items', 'items.menuItem'],
            });
        }

        async updateOrder(
            orderId: string,
            dto: UpdateOrderDto,
            waiterId: string
            ) {
            const { status } = dto;

            const order = await this.ordersRepository.findOne({
                where: { id: orderId },
                relations: ['waiter', 'restaurant'],
            });

            if (!order) {
                throw new NotFoundException('Orden no encontrada');
            }

            if (order.waiter.id !== waiterId) {
                throw new ForbiddenException('No podés modificar esta orden');
            }

            if (status) {
                const validTransitions = {
                OPEN: ['IN_PROGRESS', 'READY_TO_PAY', 'CANCELLED'],
                IN_PROGRESS: ['READY_TO_PAY', 'CANCELLED'],
                READY_TO_PAY: ['PAID'],
                PAID: [],
                CANCELLED: [],
                };

                if (!validTransitions[order.status]?.includes(status)) {
                throw new ForbiddenException(
                    `No podés pasar de ${order.status} a ${status}`
                );
                }

                order.status = status;

                if (status === OrderStatus.PAID) {
                order.isActive = false;
                }
            }

            return await this.ordersRepository.save(order);
            }


    async closeOrder(orderId: string, waiterId: string) {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, isActive: true },
            relations: ['waiter'],
        });

        if (!order) {
            throw new NotFoundException('Orden no encontrada');
        }

        if (order.waiter.id !== waiterId) {
            throw new ForbiddenException('No podés cerrar esta orden');
        }

        if (order.total === 0) {
            throw new ForbiddenException('No podés cerrar una orden vacía');
        }

        order.isActive = false;
        order.status = OrderStatus.CANCELLED;

        return await this.ordersRepository.save(order);
    }

}