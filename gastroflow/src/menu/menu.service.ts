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
  // PUBLIC
  // =
  async getPublicMenu() {
    const categories = await this.menuCategoryRepository.find({
      where: { is_active: true },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });

    const result = await Promise.all(
      categories.map(async (category) => {
        const items = await this.menuItemRepository.find({
          where: {
            category_id: category.id,
            status: MenuItemStatus.AVAILABLE,
          },
          order: {
            display_order: 'ASC',
            created_at: 'ASC',
          },
        });

        return {
          category_id: category.id,
          category_name: category.name,
          category_description: category.description,
          display_order: category.display_order,
          items,
        };
      }),
    );

    return result.filter((group) => group.items.length > 0);
  }

  // =========================
  // ADMIN
  // =========================

  async getAdminMenu() {
    const categories = await this.menuCategoryRepository.find({
      where: { is_active: true },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });

    const result = await Promise.all(
      categories.map(async (category) => {
        const items = await this.menuItemRepository.find({
          where: {
            category_id: category.id,
          },
          order: {
            display_order: 'ASC',
            created_at: 'ASC',
          },
        });

        return {
          category_id: category.id,
          category_name: category.name,
          category_description: category.description,
          display_order: category.display_order,
          items,
        };
      }),
    );

    return result;
  }

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

  async findAllItems(query: QueryMenuItemsDto) {
    const qb = this.menuItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category');

    if (query.category_id) {
      qb.andWhere('item.category_id = :category_id', {
        category_id: query.category_id,
      });
    }

    if (query.status) {
      qb.andWhere('item.status = :status', {
        status: query.status,
      });
    }

    if (query.tag) {
      qb.andWhere('LOWER(item.tags) LIKE LOWER(:tag)', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.allergen) {
      qb.andWhere('LOWER(item.allergens) LIKE LOWER(:allergen)', {
        allergen: `%${query.allergen}%`,
      });
    }

    if (query.view === 'public') {
      qb.andWhere('item.is_available = true');
      qb.andWhere('item.status = :availableStatus', {
        availableStatus: MenuItemStatus.AVAILABLE,
      });
      qb.andWhere('category.is_active = true');
    }

    return await qb.orderBy('item.display_order', 'ASC').getMany();
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

  async removeItem(id: string): Promise<MenuItem> {
    const item = await this.findOneItem(id);
    return await this.menuItemRepository.remove(item);
  }

  // =========================
  // SEED BELLA VITA
  // =========================

  async seedMenu() {
    const existingCategories = await this.menuCategoryRepository.count();

    if (existingCategories > 0) {
      throw new BadRequestException('El menú ya tiene información cargada');
    }

    const restaurantId = '11111111-1111-1111-1111-111111111111'; // fijo para demo

    const categoriesData = [
      { name: 'Antipasti', display_order: 1 },
      { name: 'Primi Piatti', display_order: 2 },
      { name: 'Pizze', display_order: 3 },
      { name: 'Dolci', display_order: 4 },
      { name: 'Bevande', display_order: 5 },
    ];

    const savedCategories: Record<string, MenuCategory> = {};

    for (const cat of categoriesData) {
      const category = await this.menuCategoryRepository.save({
        restaurant_id: restaurantId,
        name: cat.name,
        description: `Categoría ${cat.name}`,
        display_order: cat.display_order,
        is_active: true,
      });

      savedCategories[cat.name] = category;
    }

    const itemsData = [
      {
        name: 'Bruschetta',
        description: 'Pan tostado con tomate y albahaca.',
        price: '18000',
        category: 'Antipasti',
        tags: 'entrada,italiano,bestseller',
        allergens: 'gluten',
        prep_time_minutes: 10,
        image_url: undefined,
        is_available: true,
        status: MenuItemStatus.AVAILABLE,
        display_order: 1,
      },
      {
        name: 'Carbonara',
        description: 'Pasta cremosa con panceta y parmesano.',
        price: '36000',
        category: 'Primi Piatti',
        tags: 'pasta,italiano,bestseller',
        allergens: 'gluten,lacteos',
        prep_time_minutes: 18,
        image_url: undefined,
        is_available: true,
        status: MenuItemStatus.AVAILABLE,
        display_order: 1,
      },
      {
        name: 'Pizza Margherita',
        description: 'Pizza clásica con tomate, mozzarella y albahaca.',
        price: '32000',
        category: 'Pizze',
        tags: 'pizza,vegetariano',
        allergens: 'gluten,lacteos',
        prep_time_minutes: 20,
        image_url: undefined,
        is_available: true,
        status: MenuItemStatus.AVAILABLE,
        display_order: 1,
      },
      {
        name: 'Tiramisú',
        description: 'Postre italiano con café y mascarpone.',
        price: '16000',
        category: 'Dolci',
        tags: 'postre,cafe',
        allergens: 'lacteos,huevo,gluten',
        prep_time_minutes: 8,
        image_url: undefined,
        is_available: true,
        status: MenuItemStatus.AVAILABLE,
        display_order: 1,
      },
      {
        name: 'Limonada',
        description: 'Limonada fresca de la casa.',
        price: '9000',
        category: 'Bevande',
        tags: 'bebida,refrescante',
        allergens: '',
        prep_time_minutes: 5,
        image_url: undefined,
        is_available: true,
        status: MenuItemStatus.AVAILABLE,
        display_order: 1,
      },
    ];

    for (const item of itemsData) {
      await this.menuItemRepository.save({
        restaurant_id: restaurantId,
        category_id: savedCategories[item.category].id,
        category: savedCategories[item.category],
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        is_available: item.is_available,
        allergens: item.allergens,
        tags: item.tags,
        prep_time_minutes: item.prep_time_minutes,
        status: item.status,
        display_order: item.display_order,
      });
    }

    return {
      message: 'Seed Bella Vita creado correctamente',
      categoriesCreated: Object.keys(savedCategories).length,
      itemsCreated: itemsData.length,
    };
  }
}
