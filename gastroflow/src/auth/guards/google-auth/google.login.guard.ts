import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleLoginGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return {
      state: 'login',
    };
  }
}
