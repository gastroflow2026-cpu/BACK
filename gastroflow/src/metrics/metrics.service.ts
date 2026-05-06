import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order_item';
import { Reservation } from '../reservations/entities/reservation.entity';
import { RestaurantTables } from '../restaurant_tables/entities/restaurant_table.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../common/order.enum';
import { ReservationStatus } from '../common/reservation.enum';
import { UserRole } from '../common/user.enums';
import { MetricsPeriod, MetricsQueryDto } from './dto/metrics-query.dto';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,

    @InjectRepository(RestaurantTables)
    private readonly tablesRepository: Repository<RestaurantTables>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private buildDateRange(query: MetricsQueryDto): { start: Date; end: Date } {
    const ref = query.date ? new Date(`${query.date}T00:00:00`) : new Date();
    const period = query.period ?? MetricsPeriod.DAY;

    const start = new Date(ref);
    const end = new Date(ref);

    if (period === MetricsPeriod.DAY) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (period === MetricsPeriod.WEEK) {
      const day = start.getDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      start.setDate(start.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  private buildPreviousDateRange(query: MetricsQueryDto): {
    start: Date;
    end: Date;
  } {
    const current = this.buildDateRange(query);
    const diffMs = current.end.getTime() - current.start.getTime() + 1;

    return {
      start: new Date(current.start.getTime() - diffMs),
      end: new Date(current.end.getTime() - diffMs),
    };
  }

  private calcDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────

  async getSummary(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(query);
    const { start: prevStart, end: prevEnd } = this.buildPreviousDateRange(query);

    const [current, previous] = await Promise.all([
      this.ordersRepository.find({
        where: {
          restaurant: { id: restaurantId },
          status: OrderStatus.PAGADO,
          paid_at: Between(start, end),
        },
      }),
      this.ordersRepository.find({
        where: {
          restaurant: { id: restaurantId },
          status: OrderStatus.PAGADO,
          paid_at: Between(prevStart, prevEnd),
        },
      }),
    ]);

    const totalSales = current.reduce((sum, o) => sum + Number(o.total), 0);
    const prevTotalSales = previous.reduce((sum, o) => sum + Number(o.total), 0);

    const orderCount = current.length;
    const prevOrderCount = previous.length;

    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
    const prevAvgTicket =
      prevOrderCount > 0 ? prevTotalSales / prevOrderCount : 0;

    return {
      period: query.period ?? MetricsPeriod.DAY,
      dateRange: { start, end },
      totalSales: Math.round(totalSales * 100) / 100,
      totalSalesDelta: this.calcDelta(totalSales, prevTotalSales),
      orderCount,
      orderCountDelta: this.calcDelta(orderCount, prevOrderCount),
      avgTicket: Math.round(avgTicket * 100) / 100,
      avgTicketDelta: this.calcDelta(avgTicket, prevAvgTicket),
    };
  }

  // ─── Sales by payment method ──────────────────────────────────────────────

  async getSalesByPaymentMethod(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(query);

    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: OrderStatus.PAGADO,
        paid_at: Between(start, end),
      },
      select: ['id', 'total', 'payment_method'],
    });

    const grouped: Record<string, { count: number; total: number }> = {};

    for (const order of orders) {
      const method = order.payment_method ?? 'sin_metodo';
      if (!grouped[method]) grouped[method] = { count: 0, total: 0 };
      grouped[method].count++;
      grouped[method].total += Number(order.total);
    }

    return Object.entries(grouped).map(([method, data]) => ({
      method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    }));
  }

  // ─── Orders by status ────────────────────────────────────────────────────

  async getOrdersByStatus(restaurantId: string) {
    const orders = await this.ordersRepository.find({
      where: { restaurant: { id: restaurantId } },
      select: ['id', 'status'],
    });

    const grouped: Record<string, number> = {};
    for (const order of orders) {
      grouped[order.status] = (grouped[order.status] ?? 0) + 1;
    }

    return Object.entries(grouped).map(([status, count]) => ({
      status,
      count,
    }));
  }

  // ─── Average order time ──────────────────────────────────────────────────

  async getAvgOrderTime(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(query);

    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: OrderStatus.PAGADO,
        paid_at: Between(start, end),
      },
      select: ['id', 'created_at', 'paid_at'],
    });

    const withTimes = orders.filter((o) => o.created_at && o.paid_at);

    if (!withTimes.length) {
      return { avgMinutes: 0, sampleSize: 0 };
    }

    const totalMs = withTimes.reduce((sum, o) => {
      return sum + (o.paid_at!.getTime() - o.created_at.getTime());
    }, 0);

    const avgMs = totalMs / withTimes.length;
    const avgMinutes = Math.round(avgMs / 60000);

    return { avgMinutes, sampleSize: withTimes.length };
  }

  // ─── Tables occupancy ────────────────────────────────────────────────────

  async getTablesOccupancy(restaurantId: string) {
    const [allTables, activeTables] = await Promise.all([
      this.tablesRepository.count({
        where: { restaurant: { id: restaurantId }, is_active: true },
      }),
      this.ordersRepository.count({
        where: { restaurant: { id: restaurantId }, isActive: true },
      }),
    ]);

    const occupancyRate =
      allTables > 0 ? Math.round((activeTables / allTables) * 1000) / 10 : 0;

    return {
      totalTables: allTables,
      occupiedTables: activeTables,
      freeTables: Math.max(allTables - activeTables, 0),
      occupancyRate,
    };
  }

  // ─── Reservations today ──────────────────────────────────────────────────

  async getReservationsToday(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(
      query.date
        ? query
        : { ...query, period: MetricsPeriod.DAY },
    );

    const reservations = await this.reservationsRepository.find({
      where: {
        restaurant: { id: restaurantId },
        reservation_date: Between(start, end),
      },
      select: ['id', 'status', 'guests_count', 'start_time'],
    });

    const grouped: Record<string, number> = {};
    let totalGuests = 0;

    for (const reservation of reservations) {
      grouped[reservation.status] = (grouped[reservation.status] ?? 0) + 1;
      totalGuests += reservation.guests_count ?? 0;
    }

    return {
      total: reservations.length,
      totalGuests,
      byStatus: Object.entries(grouped).map(([status, count]) => ({
        status,
        count,
      })),
      confirmed: grouped[ReservationStatus.CONFIRMED] ?? 0,
      pending: grouped[ReservationStatus.PENDING] ?? 0,
      cancelled: grouped[ReservationStatus.CANCELADO] ?? 0,
    };
  }

  // ─── Top menu items ──────────────────────────────────────────────────────

  async getTopMenuItems(
    restaurantId: string,
    query: MetricsQueryDto,
    limit = 5,
  ) {
    const { start, end } = this.buildDateRange(query);

    const items = await this.orderItemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.menuItem', 'menuItem')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.PAGADO })
      .andWhere('order.paid_at BETWEEN :start AND :end', { start, end })
      .select('menuItem.id', 'menuItemId')
      .addSelect('menuItem.name', 'name')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect(
        'SUM(item.quantity * item.unit_price)',
        'totalRevenue',
      )
      .groupBy('menuItem.id')
      .addGroupBy('menuItem.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      totalQuantity: Number(item.totalQuantity),
      totalRevenue: Math.round(Number(item.totalRevenue) * 100) / 100,
    }));
  }

  // ─── Staff performance ───────────────────────────────────────────────────

  async getStaffPerformance(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(query);

    const waiters = await this.usersRepository.find({
      where: {
        restaurant_id: restaurantId,
        role: UserRole.WAITER,
        is_active: true,
      },
      select: ['id', 'first_name', 'last_name'],
    });

    const results = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.PAGADO })
      .andWhere('order.paid_at BETWEEN :start AND :end', { start, end })
      .select('order.waiter_id', 'waiterId')
      .addSelect('COUNT(order.id)', 'orderCount')
      .addSelect('SUM(order.total)', 'totalSales')
      .addSelect('AVG(order.total)', 'avgTicket')
      .groupBy('order.waiter_id')
      .getRawMany();

    const waiterMap = new Map(waiters.map((w) => [w.id, w]));

    return results.map((row) => {
      const waiter = waiterMap.get(row.waiterId);
      return {
        waiterId: row.waiterId,
        waiterName: waiter
          ? `${waiter.first_name} ${waiter.last_name}`
          : 'Mozo desconocido',
        orderCount: Number(row.orderCount),
        totalSales: Math.round(Number(row.totalSales) * 100) / 100,
        avgTicket: Math.round(Number(row.avgTicket) * 100) / 100,
      };
    });
  }

  // ─── Sales by day of week ────────────────────────────────────────────────

  async getSalesByDayOfWeek(restaurantId: string, query: MetricsQueryDto) {
    const { start, end } = this.buildDateRange(query);

    const orders = await this.ordersRepository.find({
      where: {
        restaurant: { id: restaurantId },
        status: OrderStatus.PAGADO,
        paid_at: Between(start, end),
      },
      select: ['id', 'total', 'paid_at'],
    });

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const grouped: Record<number, { count: number; total: number }> = {};

    for (let i = 0; i < 7; i++) grouped[i] = { count: 0, total: 0 };

    for (const order of orders) {
      if (!order.paid_at) continue;
      const dayIndex = order.paid_at.getDay();
      grouped[dayIndex].count++;
      grouped[dayIndex].total += Number(order.total);
    }

    return days.map((day, index) => ({
      day,
      count: grouped[index].count,
      total: Math.round(grouped[index].total * 100) / 100,
    }));
  }
}
