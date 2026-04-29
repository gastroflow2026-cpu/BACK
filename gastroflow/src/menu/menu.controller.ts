import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { MenuItemStatus } from '../common/menu.enum';
import { UserRole } from '../common/user.enums';
import { Role } from '../decorators/roles.decorators';
import { MenuService } from './menu.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from './dto/menu-category.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { QueryMenuItemsDto } from './dto/query-menu-items.dto';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // =========================
  // PUBLIC
  // =========================

  @Get(':restaurantId/public')
  @ApiOperation({
    summary: 'Obtener menú público',
    description: 'Retorna el menú visible al público, agrupado por categorías.',
  })
  async getPublicMenu(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.getPublicMenu(restaurantId);
  }

  // =========================
  // ADMIN - VISTA GENERAL
  // =========================

  @Get(':restaurantId/admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener menú admin',
    description:
      'Retorna todas las categorías e ítems para administración, incluyendo inactivos o agotados.',
  })
  getAdminMenu(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.getAdminMenu(restaurantId);
  }

  // =========================
  // CATEGORY METHODS
  // =========================

  @Post('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear categoría del menú' })
  createCategory(@Body() dto: CreateMenuCategoryDto, @Req() req: any) {
    return this.menuService.createCategory(dto, req.user.restaurant_id);
  }

  @Get(':restaurantId/categories')
  @ApiOperation({ summary: 'Listar categorías activas del menú' })
  findAllCategories(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menuService.findAllCategories(restaurantId);
  }

  @Get(':restaurantId/categories/:id')
  @ApiOperation({ summary: 'Obtener categoría por id' })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
  })
  findOneCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.menuService.findOneCategory(id, restaurantId);
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar categoría del menú' })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
  })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuCategoryDto,
    @Req() req: any
  ) {
    return this.menuService.updateCategory(id, dto, req.user.restaurant_id);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desactivar categoría del menú',
    description:
      'Debe validar que no existan ítems asociados antes de eliminarla.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
  })
  removeCategory(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.menuService.removeCategory(id, req.user.restaurant_id);
  }

  // =========================
  // ITEM METHODS
  // =========================

  @Post('items')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear platillo del menú' })
  createItem(@Body() dto: CreateMenuItemDto, @Req() req: any) {
    return this.menuService.createItem(dto, req.user.restaurant_id);
  }

  @Get(':restaurantId/items')
  @ApiOperation({ summary: 'Listar platillos del menú' })
  findAllItems(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: QueryMenuItemsDto,
  ) {
    return this.menuService.findAllItems(query, restaurantId);
  }

  @Get(':restaurantId/items/:id')
  @ApiOperation({ summary: 'Obtener platillo por id' })
  @ApiParam({
    name: 'id',
    description: 'ID del platillo',
  })
  findOneItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,) {
    return this.menuService.findOneItem(id, restaurantId);
  }

  @Patch('items/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar platillo del menú' })
  @ApiParam({
    name: 'id',
    description: 'ID del ítem',
  })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
    @Req() req: any
  ) {
    return this.menuService.updateItem(id, dto, req.user.restaurant_id);
  }

  @Patch('items/:id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado del platillo' })
  @ApiParam({
    name: 'id',
    description: 'ID del platillo',
  })
  updateItemStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: MenuItemStatus,
    @Req() req: any
  ) {
    return this.menuService.updateItemStatus(id, status, req.user.restaurant_id);
  }

  @Delete('items/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar platillo del menú' })
  @ApiParam({
    name: 'id',
    description: 'ID del platillo',
  })
  removeItem(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.menuService.removeItem(id, req.user.restaurant_id);
  }

  // =========================
  // SEED
  // =========================

  @Post('seed')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cargar seed inicial del menú Bella Vita',
    description:
      'Crea categorías e ítems base del menú para pruebas en Swagger y demo académica.',
  })
  seedMenu() {
    return this.menuService.seedMenu();
  }
}
