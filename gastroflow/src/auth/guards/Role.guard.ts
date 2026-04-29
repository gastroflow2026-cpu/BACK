import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/user.enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (UserRole | string)[]
    >('roles', [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
      : user?.role
        ? [user.role]
        : [];

    const isValid = requiredRoles.some((role) =>
      userRoles.includes(String(role)),
    );

    if (!isValid) {
      throw new ForbiddenException('Acceso denegado');
    }

    return true;
  }
}
