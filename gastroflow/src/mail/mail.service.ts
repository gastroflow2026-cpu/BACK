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
}
