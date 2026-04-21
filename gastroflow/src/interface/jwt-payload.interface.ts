export interface JwtPayload {
  id: string;        // userId (UUID)
  email: string;
  role: string;       // 'ADMIN' | 'MESERO' | 'COCINA' | 'CAJA'
  restaurantId: string; // multi-tenancy
  iat?: number;
  exp?: number;
}