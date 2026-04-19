import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { CreateUserDto, LoginUserDto } from '../users/dto/user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleLoginGuard } from './guards/google-auth/google.login.guard';
import { GoogleRegisterGuard } from './guards/google-auth/google.register.guard';
import { environment } from '../config/enviroment';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GoogleLoginGuard)
  @ApiOperation({
    summary: 'Inicio de sesión con Google',
    description:
      'Inicia el flujo de autenticación con Google y redirige al usuario a la pantalla de consentimiento.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección a Google para autenticar al usuario.',
  })
  @Get('google/login')
  googleLogin() {}
  @UseGuards(GoogleRegisterGuard)
  @ApiOperation({
    summary: 'Registro con Google',
    description:
      'Inicia el flujo de registro con Google y redirige al usuario a la pantalla de consentimiento.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección a Google para registrar al usuario.',
  })
  @Get('google/register')
  googleRegister() {}

  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback de Google',
    description:
      'Endpoint utilizado por Google para completar la autenticación. Genera el token y redirige al frontend.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección al frontend con el token JWT generado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No se pudo autenticar al usuario con Google.',
  })
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const isRegisterFlow = req.query?.state === 'register';
    const errorBaseUrl = isRegisterFlow
      ? `${environment.FRONTEND_URL}/register`
      : `${environment.FRONTEND_URL}/login`;
    if (res.headersSent) {
      return;
    }

    if (!req.user) {
      if (!req.query?.code && !req.query?.error) {
        return res.status(204).send();
      }

      return res.redirect(`${errorBaseUrl}?error=google_auth_failed`);
    }

    const response = await this.authService.loginWithProvider(req.user);

    console.log('[AuthController.googleCallback] success', {
      query: req.query,
      userId: req.user?.id,
      email: req.user?.email,
    });

    if (res.headersSent) {
      return;
    }

    return res.redirect(
      `${environment.FRONTEND_URL}?token=${encodeURIComponent(response.token)}`,
    );
  }

  @HttpCode(201)
  @ApiOperation({ summary: 'Registro de un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos para el registro',
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos necesarios para crear un nuevo usuario',
  })
  @Post('signup')
  signUp(@Body() newUserData: CreateUserDto) {
    return this.authService.signUp(newUserData);
  }

  @HttpCode(200)
  @Post('signin')
  @ApiOperation({ summary: 'Inicio de sesión del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso. Retorna el token JWT.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  @ApiBody({
    type: LoginUserDto,
    description: 'Datos necesarios para iniciar sesión',
  })
  signIn(@Body() userData: LoginUserDto) {
    return this.authService.signIn(userData.email, userData.password);
  }
}
