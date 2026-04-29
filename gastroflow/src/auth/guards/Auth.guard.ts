import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    console.log('AUTH HEADER:', authHeader);

    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Bearer token not found');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      console.log('JWT PAYLOAD:', payload);

      payload.iat = new Date(payload.iat * 1000);
      payload.exp = new Date(payload.exp * 1000);
      request.user = payload;

      return true;
    } catch (err) {
      console.log('JWT ERROR:', err);
      throw new UnauthorizedException('Invalid Token');
    }
  }
}
