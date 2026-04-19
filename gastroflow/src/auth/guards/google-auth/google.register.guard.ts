import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleRegisterGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return {
      state: 'register',
    };
  }
}
