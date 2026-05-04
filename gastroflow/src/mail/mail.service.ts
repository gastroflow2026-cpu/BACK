import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface SendTemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendTemplateMail({
    to,
    subject,
    template,
    context = {},
  }: SendTemplateMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      this.logger.log(`Correo enviado a ${to} con template ${template}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error enviando correo a ${to}`, error?.stack);
      } else {
        this.logger.error(`Error enviando correo a ${to}`);
      }
      throw new InternalServerErrorException('No se pudo enviar el correo');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendTemplateMail({
      to,
      subject: 'Bienvenido a Gastroflow',
      template: 'welcome',
      context: {
        name,
      },
    });
  }

  async sendGenericNotification(
    to: string,
    title: string,
    message: string,
  ): Promise<void> {
    await this.sendTemplateMail({
      to,
      subject: title,
      template: 'generic-notification',
      context: {
        title,
        message,
      },
    });
  }

  async sendReservationCreatedEmail(data: {
    to: string;
    name: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Reserva confirmada',
      template: 'reservation-created',
      context: {
        name: data.name,
        date: data.date,
        time: data.time,
      },
    });
  }

  async sendSubscriptionActivatedEmail(
    to: string,
    name: string,
    planName: string,
  ): Promise<void> {
    await this.sendTemplateMail({
      to,
      subject: 'Tu suscripción está activa',
      template: 'subscription-activated',
      context: {
        name,
        planName,
      },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.sendTemplateMail({
      to,
      subject: 'Restablecer contraseña — Gastroflow',
      template: 'reset-password',
      context: { name, resetLink },
    });
  }

  async sendReservationCancelledEmail(data: {
    to: string;
    name: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Reserva cancelada',
      template: 'reservation-cancelled',
      context: {
        name: data.name,
      },
    });
  }

  async sendPaymentConfirmationEmail(data: {
    to: string;
    name: string;
    restaurantName: string;
    amount: number;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Pago confirmado',
      template: 'payment-confirmation',
      context: {
        name: data.name,
        restaurantName: data.restaurantName,
        amount: data.amount,
      },
    });
  }

  async sendSubscriptionCancelledEmail(data: {
    to: string;
    name: string;
    planName: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Suscripción cancelada',
      template: 'subscription-cancelled',
      context: {
        name: data.name,
        planName: data.planName,
      },
    });
  }
  async sendRestaurantRejectedEmail(data: {
    to: string;
    name: string;
    notes?: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Solicitud de restaurante rechazada',
      template: 'restaurant-rejected',
      context: {
        name: data.name,
        notes: data.notes ?? 'No se especificó un motivo.',
      },
    });
  }
  async sendRestaurantSuspendedEmail(data: {
    to: string;
    name: string;
    notes?: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Restaurante suspendido en GastroFlow',
      template: 'restaurant-suspended',
      context: {
        name: data.name,
        notes: data.notes ?? 'No se especificó un motivo.',
      },
    });
  }

  async sendEmployeeCreatedEmail(data: {
    to: string;
    name: string;
    role: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Bienvenido al equipo de GastroFlow',
      template: 'employee-created',
      context: {
        name: data.name,
        role: data.role,
      },
    });
  }

  async sendEmployeeDismissedEmail(data: {
    to: string;
    name: string;
    role: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Finalización de vinculación laboral',
      template: 'employee-dismissed',
      context: {
        name: data.name,
        role: data.role,
      },
    });
  }

  async sendSubscriptionReactivatedEmail(data: {
    to: string;
    name: string;
    planName: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: 'Suscripción reactivada',
      template: 'subscription-reactivated',
      context: {
        name: data.name,
        planName: data.planName,
      },
    });
  }
}
