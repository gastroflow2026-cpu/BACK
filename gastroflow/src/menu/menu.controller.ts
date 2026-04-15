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
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';

import { MenuService } from './menu.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from './dto/menu-category.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { QueryMenuItemsDto } from './dto/query-menu-items.dto';
import { MenuItemStatus } from '../common/menu.enum';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // =========================
  // CATEGORY METHODS
  // =========================

  @Post('categories')
  @ApiOperation({ summary: 'Crear categoría del menú' })
  createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías activas del menú' })
  findAllCategories() {
    return this.menuService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Obtener categoría por id' })
  findOneCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findOneCategory(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Actualizar categoría del menú' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Desactivar categoría del menú' })
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.removeCategory(id);
  }

  // =========================
  // ITEM METHODS
  // =========================

  @Post('items')
  @ApiOperation({ summary: 'Crear platillo del menú' })
  createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'Listar platillos del menú' })
  findAllItems(@Query() query: QueryMenuItemsDto) {
    return this.menuService.findAllItems(query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Obtener platillo por id' })
  findOneItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.findOneItem(id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Actualizar platillo del menú' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateItem(id, dto);
  }

  @Patch('items/:id/status')
  @ApiOperation({ summary: 'Actualizar estado del platillo' })
  updateItemStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: MenuItemStatus,
  ) {
    return this.menuService.updateItemStatus(id, status);
  }

  @Delete('items/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar platillo del menú' })
  @ApiParam({
    name: 'id',
    description: 'ID del platillo',
  })
  removeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.menuService.removeItem(id);
  }

  // =========================
  // SEED
  // =========================

  @Post('seed')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(UserRole.REST_ADMIN)
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
