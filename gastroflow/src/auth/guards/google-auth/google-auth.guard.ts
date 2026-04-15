import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const message = String(err?.message ?? info?.message ?? '').toLowerCase();
    const resolvedUser = user ?? request.user;
    const isRegisterFlow = request.query?.state === 'register';
    const errorBaseUrl = isRegisterFlow
      ? 'http://localhost:3001/register'
      : 'http://localhost:3001/login';

    console.log('[GoogleAuthGuard]', {
      method: request.method,
      path: request.path,
      originalUrl: request.originalUrl,
      query: request.query,
      err: err?.message,
      info: info?.message,
      hasUser: !!user,
      requestHasUser: !!request.user,
      resolvedUserEmail: resolvedUser?.email,
    });

    if (resolvedUser) {
      request.user = resolvedUser;
      return resolvedUser;
    }

    if (response.headersSent) {
      return null;
    }

    if (message.includes('provider_conflict')) {
      response.redirect(`${errorBaseUrl}?error=provider_conflict`);
      return null;
    }

    if (message.includes('google_account_exists')) {
      response.redirect(`${errorBaseUrl}?error=google_account_exists`);
      return null;
    }

    response.redirect(`${errorBaseUrl}?error=google_auth_failed`);
    return null;
  }
}
