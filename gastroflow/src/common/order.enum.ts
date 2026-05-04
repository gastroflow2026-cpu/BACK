export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  PREPARACION = 'PREPARACION',
  SERVIDO = 'SERVIDO',
  LISTA_PARA_PAGAR = 'LISTA_PARA_PAGAR',
  PAGADO = 'PAGADO',
}

export enum KitchenOrderStatus {
  PREPARACION = 'PREPARACION',
  SERVIDO = 'SERVIDO',
}

export enum PaymentMethod {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  QR = 'qr',
}

export enum OrderItemStatus {
  PENDING = 'PENDIENTE',
  COOKING = 'EN_COCINA',
  READY = 'LISTO',
  DELIVERED = 'ENTREGADO',
  CANCELLED = 'CANCELADO',
}
