import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/Role.guard';


@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios sin las contraseñas',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @UseGuards(AuthGuard, RolesGuard)
  async getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
    return this.usersService.getAllUsers();
  }

  
}
