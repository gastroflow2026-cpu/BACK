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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { CreateUserDto, LoginUserDto } from '../users/dto/user.dto';
import { GoogleLoginGuard } from './guards/google-auth/google.login.guard';
import { GoogleRegisterGuard } from './guards/google-auth/google.register.guard';
import { environment } from '../config/enviroment';
import {
  OwnerAuthResponseDto,
  OwnerRestaurantOnboardingDto,
  RegisterRestaurantOwnerDto,
} from './dto/owner-auth.dto';
import { AuthGuard } from './guards/Auth.guard';
import { RolesGuard } from './guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GoogleLoginGuard)
  @ApiOperation({
    summary: 'Inicio de sesion con Google',
    description:
      'Inicia el flujo de autenticacion con Google y redirige al usuario a la pantalla de consentimiento.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redireccion a Google para autenticar al usuario.',
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
    description: 'Redireccion a Google para registrar al usuario.',
  })
  @Get('google/register')
  googleRegister() {}

  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback de Google',
    description:
      'Endpoint utilizado por Google para completar la autenticacion. Genera el token y redirige al frontend.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redireccion al frontend con el token JWT generado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No se pudo autenticar al usuario con Google.',
  })
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const isRegisterFlow = req.query?.state === 'register';
    const isNewGoogleUser = Boolean(req.user?.isNewGoogleUser);
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

    if (isRegisterFlow && isNewGoogleUser) {
      return res.redirect(
        `${environment.FRONTEND_URL}/login?registered=google_success`,
      );
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
    description: 'Datos invalidos para el registro',
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya esta registrado',
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

  @HttpCode(201)
  @Post('owner/signup')
  @ApiOperation({
    summary: 'Registro del dueno o administrador principal del restaurante',
  })
  @ApiResponse({
    status: 201,
    description: 'Dueno registrado correctamente',
    type: OwnerAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos o email ya registrado',
  })
  @ApiBody({
    type: RegisterRestaurantOwnerDto,
    description: 'Datos del dueno para el alta inicial',
  })
  signUpRestaurantOwner(@Body() newOwnerData: RegisterRestaurantOwnerDto) {
    return this.authService.signUpRestaurantOwner(newOwnerData);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Inicio de sesion del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesion exitoso. Retorna el token JWT.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos',
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
    description: 'Datos necesarios para iniciar sesion',
  })
  @Post('signin')
  signIn(@Body() userData: LoginUserDto) {
    return this.authService.signIn(userData.email, userData.password);
  }

  @HttpCode(200)
  @Post('owner/signin')
  @ApiOperation({
    summary: 'Inicio de sesion del dueno o admin del restaurante',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesion exitoso del admin del restaurante',
    type: OwnerAuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'El usuario no tiene permisos de administrador',
  })
  @ApiBody({
    type: LoginUserDto,
    description: 'Credenciales del dueno o admin del restaurante',
  })
  signInRestaurantOwner(@Body() userData: LoginUserDto) {
    return this.authService.signInRestaurantOwner(
      userData.email,
      userData.password,
    );
  }

  @HttpCode(201)
  @Post('owner/onboarding')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Completar onboarding del restaurante del administrador',
  })
  @ApiResponse({
    status: 201,
    description: 'Restaurante creado y vinculado al administrador',
    type: OwnerAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'El administrador ya tiene restaurante o el slug/email del restaurante ya existe',
  })
  @ApiBody({
    type: OwnerRestaurantOnboardingDto,
    description: 'Datos del restaurante para completar el onboarding',
  })
  completeRestaurantOnboarding(
    @Body() restaurantData: OwnerRestaurantOnboardingDto,
    @Req() req,
  ) {
    return this.authService.completeRestaurantOnboarding(
      req.user.id,
      restaurantData,
    );
  }
}
