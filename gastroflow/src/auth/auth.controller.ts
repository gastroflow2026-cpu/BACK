import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuth } from 'google-auth-library';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { CreateUserDto } from '../users/dto/user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback() {}

  @Post('signup')
  signUp(@Body() newUserData: CreateUserDto) {
    return this.authService.signUp(newUserData);
  }
}
