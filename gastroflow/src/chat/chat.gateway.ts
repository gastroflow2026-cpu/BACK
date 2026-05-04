import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type ChatIntent =
  | 'unknown'
  | 'greeting'
  | 'reservation'
  | 'subscription'
  | 'subscription_payment'
  | 'payment'
  | 'menu'
  | 'schedule'
  | 'location'
  | 'allergens';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('chat:message')
  handleChatMessage(
    @MessageBody() data: { message: string; sender: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Mensaje recibido:', data);

    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const message = normalizeText(data.message);

    const hasKeyword = (keywords: string[]) =>
      keywords.some((keyword) => message.includes(keyword));

    const clientData = client.data as { lastIntent?: ChatIntent };

    let intent: ChatIntent = 'unknown';

    if (hasKeyword(['hola', 'buenos dias', 'buenas', 'hey'])) {
      intent = 'greeting';
    } else if (
      hasKeyword(['reserva', 'reservar', 'mesa', 'personas', 'hora'])
    ) {
      intent = 'reservation';
    } else if (hasKeyword(['suscripcion', 'plan', 'renovacion', 'membresia'])) {
      intent = 'subscription';
    } else if (hasKeyword(['pago', 'pagar', 'factura', 'cobro'])) {
      intent =
        clientData.lastIntent === 'subscription'
          ? 'subscription_payment'
          : 'payment';
    } else if (hasKeyword(['menu', 'carta', 'platos', 'comida'])) {
      intent = 'menu';
    } else if (hasKeyword(['horario', 'abren', 'cierran', 'atencion'])) {
      intent = 'schedule';
    } else if (
      hasKeyword(['ubicacion', 'direccion', 'donde quedan', 'donde esta'])
    ) {
      intent = 'location';
    } else if (
      hasKeyword([
        'alergeno',
        'alergenos',
        'gluten',
        'lacteos',
        'huevo',
        'sulfitos',
      ])
    ) {
      intent = 'allergens';
    }

    if (intent !== 'unknown') {
      clientData.lastIntent = intent;
    }

    let response =
      'Gracias por escribirnos. Puedo ayudarte con reservas, suscripciones, menú, horarios, ubicación o alérgenos.';

    if (intent === 'greeting') {
      response =
        '¡Hola! 👋 Bienvenido a GastroFlow. Puedo ayudarte con reservas, suscripciones, menú, horarios, ubicación o alérgenos.';
    }

    if (intent === 'reservation') {
      response =
        '📅 Para hacer una reserva, entra a Restaurantes, selecciona uno y elige fecha, hora y número de personas.';
    }

    if (intent === 'subscription') {
      response =
        '💳 Las suscripciones se gestionan desde el panel del restaurante. Allí puedes ver el plan, estado y fecha de renovación.';
    }

    if (intent === 'subscription_payment') {
      response =
        '💳 Puedes pagar o renovar tu suscripción desde el panel de administrador, en la sección de suscripciones o pagos.';
    }

    if (intent === 'payment') {
      response =
        'Los pagos disponibles dependen del módulo que estés usando: reservas o suscripciones. ¿Te refieres a una reserva o a una suscripción?';
    }

    if (intent === 'menu') {
      response =
        '🍽️ Puedes ver el menú completo en esta página, con categorías, precios, imágenes y alérgenos por plato.';
    }

    if (intent === 'schedule') {
      response =
        '🕐 Los horarios dependen de cada restaurante. Puedes revisarlos en el perfil del restaurante o contactarlo directamente desde GastroFlow.';
    }

    if (intent === 'location') {
      response =
        '📍 La ubicación del restaurante aparece en su perfil. Allí puedes consultar ciudad, dirección e información de contacto.';
    }

    if (intent === 'allergens') {
      response =
        '⚠️ Los alérgenos están indicados en cada plato del menú. Algunos ejemplos son gluten, lácteos, huevo y sulfitos.';
    }

    client.emit('chat:message', {
      message: response,
      sender: 'bot',
    });
  }
}
