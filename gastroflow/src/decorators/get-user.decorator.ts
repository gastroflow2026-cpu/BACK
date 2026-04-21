import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interface/jwt-payload.interface';

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user; // lo pone JwtStrategy.validate()

    return data ? user?.[data] : user;
  },
);