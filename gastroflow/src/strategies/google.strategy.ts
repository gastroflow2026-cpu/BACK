import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private readonly googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfiguration.clientID as string,
      clientSecret: googleConfiguration.clientSecret as string,
      callbackURL: googleConfiguration.callbackURL as string,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    const displayNameParts =
      profile.displayName?.trim()?.split(' ')?.filter(Boolean) ?? [];

    const firstName =
      profile.name?.givenName?.trim() || displayNameParts[0] || 'Google';

    const lastName =
      profile.name?.familyName?.trim() ||
      displayNameParts.slice(1).join(' ') ||
      'User';

    const imgUrl = profile.photos?.[0]?.value;

    console.log('[GoogleStrategy] profile', {
      email,
      firstName,
      lastName,
      imgUrl,
    });

    if (!email) {
      throw new UnauthorizedException('Google no devolvio un email valido');
    }

    try {
      const intent = req.query?.state === 'register' ? 'register' : 'login';

      const { user, isNewUser } = await this.authService.validateGoogleUser(
        {
          email,
          first_name: firstName.slice(0, 20),
          last_name: lastName.slice(0, 60),
          imgUrl,
        },
        intent,
      );

      console.log('[GoogleStrategy] user found', {
        id: user?.id,
        email: user?.email,
        auth_provider: user?.auth_provider,
        isNewUser,
      });

      return {
        ...user,
        isNewGoogleUser: isNewUser,
      };
    } catch (error) {
      const authError =
        error instanceof Error ? error : new Error('Unknown Google auth error');

      console.log(
        '[GoogleStrategy] validateGoogleUser error',
        authError.message,
      );

      throw authError;
    }
  }
}
