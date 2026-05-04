import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order_item';
import { MenuItem } from '../menu/entities/menu-item.entity';
import { User } from '../users/entities/user.entity';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import {
  KitchenOrderStatus,
  OrderStatus,
  PaymentMethod,
} from '../common/order.enum';
import { AddItemDto, PayOrderDto } from './dto/order.dto';
import { OrderGateway } from './gateways/order.gateway';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private ordersItemsRepository: Repository<OrderItem>,
    @InjectRepository(MenuItem)
    private menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(RestaurantTables)
    private restaurantsTablesRepository: Repository<RestaurantTables>,
    private orderGateway: OrderGateway,
  ) {}

  private buildSocketPayload(order: Order) {
    return {
      orderId: order.id,
      displayId: order.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      status: order.status,
      total: Number(order.total ?? 0),
      updatedAt: new Date().toISOString(),
    };
  }

  private formatKitchenOrder(order: Order) {
    return {
      id: order.id,
      displayId: order.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      status: order.status,
      createdAt: order.created_at?.toISOString(),
      startedAt: order.started_at?.toISOString() ?? null,
      servedAt: order.served_at?.toISOString() ?? null,
      deliveredAt: order.delivered_at?.toISOString() ?? null,
      notes: order.items?.find((i) => i.notes)?.notes ?? null,
      items:
        order.items?.map((item) => ({
          menuItemId: item.menuItem?.id,
          name: item.menuItem?.name ?? 'Producto sin nombre',
          quantity: item.quantity,
          price: Number(item.unit_price),
          notes: item.notes ?? null,
        })) ?? [],
    };
  }

  private async computeDisplayId(restaurantId: string): Promise<number> {
    const count = await this.ordersRepository.count({
      where: { restaurant: { id: restaurantId } },
    });
    return count + 1;
  }

  async openOrder(tableId: string, waiterId: string) {
    const waiter = await this.usersRepository.findOne({
      where: { id: waiterId },
      relations: ['restaurant'],
    });
    if (!waiter) throw new NotFoundException('Mozo no encontrado');

    const table = await this.restaurantsTablesRepository.findOne({
      where: { id: tableId },
      relations: ['restaurant'],
    });
    if (!table) throw new NotFoundException('Mesa no encontrada');

    if (table.restaurant.id !== waiter.restaurant.id) {
      throw new ForbiddenException('La mesa no pertenece a tu restaurante');
    }

    const existing = await this.ordersRepository.findOne({
      where: { table: { id: tableId }, isActive: true },
      relations: ['items', 'items.menuItem', 'table', 'waiter'],
    });
    if (existing) return existing;

    const displayId = await this.computeDisplayId(waiter.restaurant.id);

    const newOrder = this.ordersRepository.create({
      table: { id: tableId },
      restaurant: { id: waiter.restaurant.id },
      waiter: { id: waiterId },
      status: OrderStatus.PENDIENTE,
      isActive: true,
      display_id: displayId,
    });

    const saved = await this.ordersRepository.save(newOrder);

    this.orderGateway.emitToRestaurant(waiter.restaurant.id, 'order:created', {
      ...this.buildSocketPayload({ ...saved, table }),
    });

    return saved;
  }

  async addItemToOrder(orderId: string, dto: AddItemDto, waiterId: string) {
    const { menuItemId, quantity, notes } = dto;

    const order = await this.ordersRepository.findOne({
      where: { id: orderId, isActive: true },
      relations: ['waiter', 'restaurant', 'table'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada o cerrada');

    if (order.waiter.id !== waiterId) {
      throw new ForbiddenException('Esta orden no te pertenece');
    }

    if (order.status !== OrderStatus.PENDIENTE) {
      throw new ForbiddenException(
        `No se pueden agregar items: la orden esta en estado ${order.status}`,
      );
    }

    const menuItem = await this.menuItemsRepository.findOne({
      where: { id: menuItemId },
    });
    if (!menuItem)
      throw new NotFoundException('Producto no encontrado en el menu');
    if (!menuItem.is_available)
      throw new ForbiddenException('Producto no disponible');

    const orderItem = this.ordersItemsRepository.create({
      order,
      menuItem,
      quantity: Number(quantity),
      unit_price: Number(menuItem.price),
      notes,
    });
    const savedItem = await this.ordersItemsRepository.save(orderItem);

    order.total =
      Number(order.total) + Number(menuItem.price) * Number(quantity);
    await this.ordersRepository.save(order);

    this.orderGateway.emitToRestaurant(
      order.restaurant.id,
      'order:item_added',
      {
        ...this.buildSocketPayload(order),
        item: {
          id: savedItem.id,
          name: menuItem.name,
          quantity,
          price: Number(menuItem.price),
          notes,
        },
      },
    );

    return { orderId: order.id, itemId: savedItem.id, status: order.status };
  }

  async closeOrder(orderId: string, waiterId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, isActive: true },
      relations: ['waiter', 'restaurant', 'table'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.waiter.id !== waiterId) {
      throw new ForbiddenException('No podes cerrar esta orden');
    }

    if (order.status !== OrderStatus.SERVIDO) {
      throw new ForbiddenException(
        `Solo se puede cerrar una orden en estado SERVIDO. Estado actual: ${order.status}`,
      );
    }

    order.status = OrderStatus.LISTA_PARA_PAGAR;
    order.isActive = false;
    order.closed_at = new Date();

    const saved = await this.ordersRepository.save(order);

    this.orderGateway.emitToRestaurant(order.restaurant.id, 'order:closed', {
      ...this.buildSocketPayload({ ...saved, table: order.table }),
      closedAt: saved.closed_at?.toISOString() ?? null,
    });

    this.orderGateway.emitToRestaurant(
      order.restaurant.id,
      'order:status_updated',
      {
        ...this.buildSocketPayload({ ...saved, table: order.table }),
        closedAt: saved.closed_at?.toISOString() ?? null,
      },
    );

    return { id: saved.id, status: saved.status };
  }

  async confirmOrderDelivery(orderId: string, waiterId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, isActive: true },
      relations: ['waiter', 'restaurant', 'table', 'items', 'items.menuItem'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.waiter.id !== waiterId) {
      throw new ForbiddenException(
        'No podes confirmar la entrega de esta orden',
      );
    }

    if (order.status !== OrderStatus.SERVIDO) {
      throw new ForbiddenException(
        `Solo se puede confirmar entrega para ordenes en estado SERVIDO. Estado actual: ${order.status}`,
      );
    }

    order.delivered_at = new Date();
    const saved = await this.ordersRepository.save(order);

    this.orderGateway.emitToRestaurant(
      order.restaurant.id,
      'order:status_updated',
      {
        ...this.buildSocketPayload({ ...saved, table: order.table }),
        deliveredAt: saved.delivered_at?.toISOString() ?? null,
      },
    );

    return {
      id: saved.id,
      displayId: saved.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      status: saved.status,
      deliveredAt: saved.delivered_at?.toISOString() ?? null,
      updatedAt: saved.updated_at?.toISOString(),
    };
  }

  async getKitchenOrders(restaurantId: string, status?: string) {
    const statusFilter = status
      ? [status as OrderStatus]
      : [OrderStatus.PENDIENTE, OrderStatus.PREPARACION, OrderStatus.SERVIDO];

    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: In(statusFilter),
      },
      relations: ['table', 'items', 'items.menuItem'],
      order: { created_at: 'ASC' },
    });

    return orders.map((o) => this.formatKitchenOrder(o));
  }

  async getKitchenOrderById(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['table', 'items', 'items.menuItem'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return this.formatKitchenOrder(order);
  }

  async updateKitchenOrderStatus(orderId: string, status: KitchenOrderStatus) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.menuItem', 'table', 'restaurant'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const validTransitions: Partial<Record<OrderStatus, OrderStatus>> = {
      [OrderStatus.PENDIENTE]: OrderStatus.PREPARACION,
      [OrderStatus.PREPARACION]: OrderStatus.SERVIDO,
    };

    const targetStatus =
      status === KitchenOrderStatus.PREPARACION
        ? OrderStatus.PREPARACION
        : OrderStatus.SERVIDO;

    if (validTransitions[order.status] !== targetStatus) {
      throw new ForbiddenException(
        `No se puede pasar de ${order.status} a ${targetStatus}`,
      );
    }

    order.status = targetStatus;
    if (targetStatus === OrderStatus.PREPARACION) order.started_at = new Date();
    if (targetStatus === OrderStatus.SERVIDO) order.served_at = new Date();

    await this.ordersRepository.save(order);

    const formatted = this.formatKitchenOrder(order);

    this.orderGateway.emitToRestaurant(
      order.restaurant.id,
      'order:status_updated',
      {
        ...this.buildSocketPayload(order),
      },
    );

    return formatted;
  }

  async getCashierOrders(restaurantId: string) {
    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: OrderStatus.LISTA_PARA_PAGAR,
      },
      relations: ['table', 'items', 'items.menuItem', 'waiter'],
      order: { created_at: 'ASC' },
    });

    return orders.map((order) => ({
      id: order.id,
      displayId: order.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      waiterName: order.waiter
        ? `${order.waiter.first_name} ${order.waiter.last_name}`
        : null,
      status: order.status,
      total: Number(order.total),
      amount: Number(order.total),
      paymentMethodExpected: ['efectivo', 'tarjeta', 'transferencia', 'qr'],
      paymentMethod: order.payment_method ?? null,
      closedAt: order.closed_at?.toISOString() ?? null,
      paidAt: order.paid_at?.toISOString() ?? null,
      paidBy: order.paid_by ?? null,
      ticketNotes:
        order.items
          ?.map((item) => item.notes)
          .filter((note) => !!note)
          .join(' | ') || null,
      items:
        order.items?.map((item) => ({
          id: item.id,
          name: item.menuItem?.name ?? 'Producto sin nombre',
          price: Number(item.unit_price),
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          subtotal: Number(item.unit_price) * item.quantity,
        })) ?? [],
      createdAt: order.created_at?.toISOString(),
    }));
  }

  async getCashierDailySummary(restaurantId: string, date?: string) {
    const referenceDate = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Number.isNaN(referenceDate.getTime())) {
      throw new BadRequestException('Fecha invalida. Usa formato YYYY-MM-DD');
    }

    const dayStart = new Date(referenceDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(referenceDate);
    dayEnd.setHours(23, 59, 59, 999);

    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: OrderStatus.PAGADO,
        paid_at: Between(dayStart, dayEnd),
      },
      relations: ['table', 'waiter'],
      order: { paid_at: 'DESC' },
    });

    const byPaymentMethod: Record<string, { count: number; total: number }> = {
      [PaymentMethod.EFECTIVO]: { count: 0, total: 0 },
      [PaymentMethod.TARJETA]: { count: 0, total: 0 },
      [PaymentMethod.TRANSFERENCIA]: { count: 0, total: 0 },
      [PaymentMethod.QR]: { count: 0, total: 0 },
      unknown: { count: 0, total: 0 },
    };

    let grossTotal = 0;

    for (const order of orders) {
      const orderTotal = Number(order.total);
      const method = order.payment_method || 'unknown';

      grossTotal += orderTotal;
      if (!byPaymentMethod[method])
        byPaymentMethod[method] = { count: 0, total: 0 };
      byPaymentMethod[method].count += 1;
      byPaymentMethod[method].total += orderTotal;
    }

    const receipts = orders.map((order) => ({
      orderId: order.id,
      displayId: order.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      total: Number(order.total),
      paymentMethod: order.payment_method ?? null,
      paidAt: order.paid_at?.toISOString() ?? null,
      paidBy: order.paid_by ?? null,
      closedAt: order.closed_at?.toISOString() ?? null,
      waiterName: order.waiter
        ? `${order.waiter.first_name} ${order.waiter.last_name}`
        : null,
    }));

    return {
      day: dayStart.toISOString().slice(0, 10),
      range: {
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
      },
      totals: {
        gross: grossTotal,
        ordersCount: orders.length,
        averageTicket: orders.length ? grossTotal / orders.length : 0,
      },
      byPaymentMethod,
      receipts,
    };
  }

  async payOrder(orderId: string, dto: PayOrderDto, cashierId: string) {
    const result = await this.ordersRepository.manager.transaction(
      async (manager) => {
        const order = await manager.getRepository(Order).findOne({
          where: { id: orderId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!order) throw new NotFoundException('Orden no encontrada');

        const orderWithRelations = await manager.getRepository(Order).findOne({
          where: { id: orderId },
          relations: ['restaurant', 'table'],
        });
        if (!orderWithRelations)
          throw new NotFoundException('Orden no encontrada');

        if (order.status === OrderStatus.PAGADO) {
          return {
            saved: orderWithRelations,
            restaurantId: orderWithRelations.restaurant.id,
            table: orderWithRelations.table,
            idempotent: true,
          };
        }

        if (order.status !== OrderStatus.LISTA_PARA_PAGAR) {
          throw new ForbiddenException(
            `Solo se pueden cobrar ordenes en estado LISTA_PARA_PAGAR. Estado actual: ${order.status}`,
          );
        }

        order.status = OrderStatus.PAGADO;
        order.paid_at = new Date();
        order.paid_by = cashierId;
        order.payment_method = dto.paymentMethod;

        const saved = await manager.getRepository(Order).save(order);
        const savedWithRelations = await manager.getRepository(Order).findOne({
          where: { id: saved.id },
          relations: ['restaurant', 'table'],
        });
        if (!savedWithRelations)
          throw new NotFoundException('Orden no encontrada');

        return {
          saved: savedWithRelations,
          restaurantId: savedWithRelations.restaurant.id,
          table: savedWithRelations.table,
          idempotent: false,
        };
      },
    );

    if (!result.idempotent) {
      this.orderGateway.emitToRestaurant(result.restaurantId, 'order:paid', {
        ...this.buildSocketPayload({ ...result.saved, table: result.table }),
        paymentMethod: result.saved.payment_method,
        paidAt: result.saved.paid_at?.toISOString() ?? null,
        paidBy: result.saved.paid_by ?? null,
      });

      this.orderGateway.emitToRestaurant(
        result.restaurantId,
        'order:status_updated',
        {
          ...this.buildSocketPayload({ ...result.saved, table: result.table }),
          paymentMethod: result.saved.payment_method,
          paidAt: result.saved.paid_at?.toISOString() ?? null,
          paidBy: result.saved.paid_by ?? null,
        },
      );
    }

    return {
      id: result.saved.id,
      status: result.saved.status,
      paidAt: result.saved.paid_at?.toISOString() ?? null,
      paidBy: result.saved.paid_by ?? null,
      paymentMethod: result.saved.payment_method ?? null,
      idempotent: result.idempotent,
    };
  }

  async getOrdersByTable(tableId: string) {
    const orders = await this.ordersRepository.find({
      where: { table: { id: tableId }, isActive: true },
      relations: ['items', 'items.menuItem', 'waiter', 'table'],
      order: { created_at: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      displayId: order.display_id,
      tableId: order.table?.id,
      tableNumber: order.table?.table_number,
      status: order.status,
      total: Number(order.total),
      isActive: order.isActive,
      deliveredAt: order.delivered_at?.toISOString() ?? null,
      waiter: order.waiter
        ? {
            id: order.waiter.id,
            name: `${order.waiter.first_name} ${order.waiter.last_name}`,
          }
        : null,
      items:
        order.items?.map((item) => ({
          id: item.id,
          menuItemId: item.menuItem?.id,
          name: item.menuItem?.name ?? 'Producto sin nombre',
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          notes: item.notes ?? null,
        })) ?? [],
      createdAt: order.created_at?.toISOString(),
    }));
  }
}
