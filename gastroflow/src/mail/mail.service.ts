import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

interface SendTemplateMailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly client: InstanceType<typeof BrevoClient>;
  private readonly from = {
    email: process.env.MAIL_FROM || 'noreply@gastroflow.com',
    name: 'Gastroflow',
  };

  constructor() {
    this.client = new BrevoClient({
      apiKey: process.env.API_KEY_BREVO!,
    });
  }

  private renderTemplate(template: string, context: Record<string, unknown>): string {
    const templatePath = path.join(process.cwd(), 'src', 'mail', 'templates', `${template}.hbs`);
    const source = fs.readFileSync(templatePath, 'utf8');
    const compiled = Handlebars.compile(source);
    return compiled(context);
  }

  async sendTemplateMail({
    to,
    subject,
    template,
    context = {},
  }: SendTemplateMailOptions): Promise<void> {
    try {
      const html = this.renderTemplate(template, context);

      await this.client.transactionalEmails.sendTransacEmail({
        to: [{ email: to }],
        sender: this.from,
        subject,
        htmlContent: html,
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
      context: { name },
    });
  }

  async sendGenericNotification(to: string, title: string, message: string): Promise<void> {
    await this.sendTemplateMail({
      to,
      subject: title,
      template: 'generic-notification',
      context: { title, message },
    });
  }

  async sendReservationCreatedEmail(data: {
    to: string;
    name: string;
    restaurantName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: `Reserva confirmada en ${data.restaurantName}`,
      template: 'reservation-created',
      context: {
        name: data.name,
        restaurantName: data.restaurantName,
        date: data.date,
        time: data.time,
      },
    });
  }

  async sendSubscriptionActivatedEmail(to: string, name: string, planName: string): Promise<void> {
    await this.sendTemplateMail({
      to,
      subject: 'Tu suscripción está activa',
      template: 'subscription-activated',
      context: { name, planName },
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
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
    restaurantName: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: `Reserva cancelada en ${data.restaurantName}`,
      template: 'reservation-cancelled',
      context: {
        name: data.name,
        restaurantName: data.restaurantName,
        date: data.date,
        time: data.time,
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
      context: { name: data.name, planName: data.planName },
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
    restaurantName: string;
  }): Promise<void> {
    await this.sendTemplateMail({
      to: data.to,
      subject: `Has sido registrado en ${data.restaurantName}`,
      template: 'employee-created',
      context: {
        name: data.name,
        role: data.role,
        restaurantName: data.restaurantName,
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
      context: { name: data.name, role: data.role },
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
      context: { name: data.name, planName: data.planName },
    });
  }
}