export enum OrderStatus {
    OPEN = 'ABIERTA',
    IN_PROGRESS = 'EN_PROGRESO',
    READY_TO_PAY = 'LISTA_PARA_PAGAR',
    PAID = 'PAGADO',
    CANCELLED = 'CANCELADO',
}

export enum OrderItemStatus {
    PENDING = 'PENDIENTE',       // recién agregado
    COOKING = 'EN_COCINA',       // el chef lo está preparando
    READY = 'LISTO',             // el chef lo terminó
    DELIVERED = 'ENTREGADO',     // el mozo lo llevó a la mesa
    CANCELLED = 'CANCELADO',
}