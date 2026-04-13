import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MenuCategory } from './entities/menu-category.entity';
import { MenuItem } from './entities/menu-item.entity';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from './dto/menu-category.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { QueryMenuItemsDto } from './dto/query-menu-items.dto';
import { MenuItemStatus } from '../common/menu.enum';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
  ) {}

  // =========================
  // CATEGORY METHODS
  //

  // Crear categoría
  async createCategory(dto: CreateMenuCategoryDto): Promise<MenuCategory> {
    const category = this.menuCategoryRepository.create({
      ...dto,
      is_active: true,
    });

    return await this.menuCategoryRepository.save(category);
  }

  // Listar categorías activas
  async findAllCategories(): Promise<MenuCategory[]> {
    return await this.menuCategoryRepository.find({
      where: { is_active: true },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });
  }

  // Buscar una categoría por id
  async findOneCategory(id: string): Promise<MenuCategory> {
    const category = await this.menuCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`No se encontró la categoría con id ${id}`);
    }

    return category;
  }

  // Actualizar categoría
  async updateCategory(
    id: string,
    dto: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.findOneCategory(id);

    Object.assign(category, dto);

    return await this.menuCategoryRepository.save(category);
  }

  // Desactivar categoría
  async removeCategory(id: string): Promise<string> {
    const category = await this.findOneCategory(id);

    const relatedItemsCount = await this.menuItemRepository.count({
      where: {
        category_id: id,
      },
    });

    if (relatedItemsCount > 0) {
      throw new BadRequestException(
        'No se puede desactivar la categoría porque tiene platillos asociados. Primero reasígnelos o desactívelos.',
      );
    }

    category.is_active = false;

    await this.menuCategoryRepository.save(category);

    return category.id;
  }

  // =========================
  // ITEM METHODS
  // =========================

  async createItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const category = await this.menuCategoryRepository.findOne({
      where: {
        id: dto.category_id,
        is_active: true,
      },
    });

    if (!category) {
      throw new BadRequestException(
        'La categoría enviada no existe o está inactiva.',
      );
    }

    const item = this.menuItemRepository.create({
      ...dto,
      price: String(dto.price),
      status: dto.status ?? MenuItemStatus.AVAILABLE,
    });

    return await this.menuItemRepository.save(item);
  }

  async findAllItems(query?: QueryMenuItemsDto): Promise<MenuItem[]> {
    const qb = this.menuItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category');

    if (query?.category_id) {
      qb.andWhere('item.category_id = :category_id', {
        category_id: query.category_id,
      });
    }

    if (query?.status) {
      qb.andWhere('item.status = :status', {
        status: query.status,
      });
    }

    if (query?.view === 'public') {
      qb.andWhere('item.status = :publicStatus', {
        publicStatus: MenuItemStatus.AVAILABLE,
      });
    }

    if (query?.tag) {
      qb.andWhere('item.tags ILIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query?.allergen) {
      qb.andWhere('item.allergens ILIKE :allergen', {
        allergen: `%${query.allergen}%`,
      });
    }

    qb.orderBy('item.display_order', 'ASC').addOrderBy(
      'item.created_at',
      'ASC',
    );

    return await qb.getMany();
  }

  async findOneItem(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`No se encontró el platillo con id ${id}`);
    }

    return item;
  }

  async updateItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.findOneItem(id);

    if (dto.category_id) {
      const category = await this.menuCategoryRepository.findOne({
        where: {
          id: dto.category_id,
          is_active: true,
        },
      });

      if (!category) {
        throw new BadRequestException(
          'La nueva categoría no existe o está inactiva.',
        );
      }
    }

    Object.assign(item, dto);

    return await this.menuItemRepository.save(item);
  }

  async updateItemStatus(
    id: string,
    status: MenuItemStatus,
  ): Promise<MenuItem> {
    const item = await this.findOneItem(id);

    item.status = status;

    return await this.menuItemRepository.save(item);
  }
}
