import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from './entities/cash-register-session.entity';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus, PaymentMethod } from '../common/order.enum';
import { CashRegisterHistoryQueryDto } from './dto/cash-register-history.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegisterSession)
    private readonly sessionsRepository: Repository<CashRegisterSession>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async openSession(
    restaurantId: string,
    cashierId: string,
    dto: OpenCashRegisterDto,
  ) {
    const existingOpenSession = await this.sessionsRepository.findOne({
      where: {
        restaurant_id: restaurantId,
        cashier_user_id: cashierId,
        status: CashRegisterSessionStatus.OPEN,
      },
    });

    if (existingOpenSession) {
      throw new BadRequestException('Ya tienes una caja abierta');
    }

    const openingAmount = Number(dto.openingAmount);
    const session = this.sessionsRepository.create({
      restaurant_id: restaurantId,
      cashier_user_id: cashierId,
      status: CashRegisterSessionStatus.OPEN,
      opening_amount: openingAmount,
      expected_closing_amount: openingAmount,
      opened_at: new Date(),
    });

    const saved = await this.sessionsRepository.save(session);
    return this.serializeSession(saved);
  }

  async getCurrentSession(restaurantId: string, cashierId: string) {
    const session = await this.sessionsRepository.findOne({
      where: {
        restaurant_id: restaurantId,
        cashier_user_id: cashierId,
        status: CashRegisterSessionStatus.OPEN,
      },
      order: { opened_at: 'DESC' },
    });

    if (!session) {
      return null;
    }

    return this.serializeSession(session);
  }

  async closeSession(
    restaurantId: string,
    cashierId: string,
    dto: CloseCashRegisterDto,
  ) {
    const now = new Date();

    return this.sessionsRepository.manager.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(CashRegisterSession);
      const orderRepo = manager.getRepository(Order);

      const session = await sessionRepo.findOne({
        where: {
          restaurant_id: restaurantId,
          cashier_user_id: cashierId,
          status: CashRegisterSessionStatus.OPEN,
        },
        order: { opened_at: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!session) {
        throw new NotFoundException('No hay una caja abierta para cerrar');
      }

      const paidOrders = await orderRepo.find({
        where: {
          restaurant: { id: restaurantId },
          status: OrderStatus.PAGADO,
          paid_by: cashierId,
          paid_at: Between(session.opened_at, now),
        },
      });

      let cashSales = 0;
      let cardSales = 0;
      let transferSales = 0;
      let qrSales = 0;

      for (const order of paidOrders) {
        const total = Number(order.total ?? 0);

        switch (order.payment_method) {
          case PaymentMethod.EFECTIVO:
            cashSales += total;
            break;
          case PaymentMethod.TARJETA:
            cardSales += total;
            break;
          case PaymentMethod.TRANSFERENCIA:
            transferSales += total;
            break;
          case PaymentMethod.QR:
            qrSales += total;
            break;
          default:
            break;
        }
      }

      const openingAmount = Number(session.opening_amount);
      const declaredClosingAmount = Number(dto.declaredClosingAmount);
      const expectedClosingAmount = openingAmount + cashSales;
      const differenceAmount = declaredClosingAmount - expectedClosingAmount;

      session.cash_sales_total = cashSales;
      session.card_sales_total = cardSales;
      session.transfer_sales_total = transferSales;
      session.qr_sales_total = qrSales;
      session.orders_paid_count = paidOrders.length;
      session.expected_closing_amount = expectedClosingAmount;
      session.declared_closing_amount = declaredClosingAmount;
      session.difference_amount = differenceAmount;
      session.closing_notes = dto.notes?.trim() || null;
      session.status = CashRegisterSessionStatus.CLOSED;
      session.closed_at = now;

      const saved = await sessionRepo.save(session);

      return {
        ...this.serializeSession(saved),
        summary: {
          openingAmount,
          expectedClosingAmount,
          declaredClosingAmount,
          differenceAmount,
          ordersPaidCount: paidOrders.length,
          salesByMethod: {
            [PaymentMethod.EFECTIVO]: cashSales,
            [PaymentMethod.TARJETA]: cardSales,
            [PaymentMethod.TRANSFERENCIA]: transferSales,
            [PaymentMethod.QR]: qrSales,
          },
        },
      };
    });
  }

  async getSessionHistory(
    restaurantId: string,
    cashierId: string,
    query: CashRegisterHistoryQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [sessions, total] = await this.sessionsRepository.findAndCount({
      where: {
        restaurant_id: restaurantId,
        cashier_user_id: cashierId,
      },
      order: {
        opened_at: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      page,
      limit,
      total,
      data: sessions.map((session) => this.serializeSession(session)),
    };
  }

  private serializeSession(session: CashRegisterSession) {
    return {
      id: session.id,
      restaurantId: session.restaurant_id,
      cashierUserId: session.cashier_user_id,
      status: session.status,
      openingAmount: Number(session.opening_amount ?? 0),
      openedAt: session.opened_at,
      closedAt: session.closed_at,
      ordersPaidCount: Number(session.orders_paid_count ?? 0),
      expectedClosingAmount: Number(session.expected_closing_amount ?? 0),
      declaredClosingAmount:
        session.declared_closing_amount === null
          ? null
          : Number(session.declared_closing_amount),
      differenceAmount:
        session.difference_amount === null
          ? null
          : Number(session.difference_amount),
      closingNotes: session.closing_notes,
      salesByMethod: {
        [PaymentMethod.EFECTIVO]: Number(session.cash_sales_total ?? 0),
        [PaymentMethod.TARJETA]: Number(session.card_sales_total ?? 0),
        [PaymentMethod.TRANSFERENCIA]: Number(session.transfer_sales_total ?? 0),
        [PaymentMethod.QR]: Number(session.qr_sales_total ?? 0),
      },
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }
}
