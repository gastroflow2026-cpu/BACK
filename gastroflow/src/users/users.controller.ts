import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseUUIDPipe, Put, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { UserRole } from '../common/user.enums';
import { UpdateRoleDto, UpdateUserDto } from './dto/user.dto';


@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN, UserRole.REST_ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios sin password' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<Omit<User, 'password_hash'>[]> {
    const validPage = Math.max(Number(page) || 1, 1);
    const validLimit = Math.max(Number(limit) || 10, 1);
    return this.usersService.getAllUsers(validPage, validLimit);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    // solo el propio usuario o un admin puede ver el perfil
    const requesterId = req.user.id;
    const requesterRole = req.user.roles;
    const isAdmin = requesterRole?.includes(UserRole.SUPER_ADMIN) || 
                    requesterRole?.includes(UserRole.REST_ADMIN);
    if (!isAdmin && requesterId !== id) {
      throw new ForbiddenException('No tienes permiso para ver este usuario');
    }
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Actualizar datos del usuario' })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    const requesterId = req.user.id;
    const isAdmin = req.user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin && requesterId !== id) {
      throw new ForbiddenException('No tienes permiso para editar este usuario');
    }
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/role')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cambiar rol de usuario' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: any,
  ) {
    if (req.user.id === id && dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes auto-asignarte SUPER_ADMIN');
    }
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete de usuario' })
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (req.user.id === id) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }
    return this.usersService.deleteUser(id);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.SUPER_ADMIN, UserRole.REST_ADMIN)
  @ApiOperation({ summary: 'Desactivar usuario' })
  desactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivateUser(id);
  }

  
}
