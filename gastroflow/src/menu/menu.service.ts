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

const BELLA_VITA_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

const BELLA_VITA_CATEGORIES = [
  { name: 'Antipasti', display_order: 1 },
  { name: 'Primi Piatti', display_order: 2 },
  { name: 'Pizze', display_order: 3 },
  { name: 'Dolci', display_order: 4 },
  { name: 'Bevande', display_order: 5 },
] as const;

const BELLA_VITA_ITEMS = [
  {
    name: 'Bruschetta',
    description: 'Pan tostado con tomate y albahaca.',
    price: '10',
    category: 'Antipasti',
    tags: 'entrada,italiano,bestseller',
    allergens: 'gluten',
    prep_time_minutes: 10,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459099/Bruschetta_nu7c04.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 1,
  },
  {
    name: 'Caprese',
    description: 'Tomate fresco, mozzarella y albahaca con aceite de oliva.',
    price: '12',
    category: 'Antipasti',
    tags: 'entrada,italiano,vegetariano',
    allergens: 'lacteos',
    prep_time_minutes: 8,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459099/Caprese_hoapi0.jpg',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 2,
  },
  {
    name: 'Carpaccio di Manzo',
    description: 'Láminas finas de res con parmesano y aceite de oliva.',
    price: '12',
    category: 'Antipasti',
    tags: 'entrada,italiano,res',
    allergens: 'lacteos',
    prep_time_minutes: 12,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459101/Carpaccio_di_manzo_uahj1m.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 3,
  },
  {
    name: 'Carbonara',
    description: 'Pasta cremosa con panceta y parmesano.',
    price: '16',
    category: 'Primi Piatti',
    tags: 'pasta,italiano,bestseller',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 18,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776280896/Pasta_Carbonara_f2t7hg.jpg',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 1,
  },
  {
    name: 'Fettuccine Alfredo',
    description: 'Pasta con salsa cremosa de queso parmesano.',
    price: '14',
    category: 'Primi Piatti',
    tags: 'pasta,italiano,cremoso',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 18,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459100/Fettuccine_Alfredo_jlaed3.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 2,
  },
  {
    name: 'Lasagna Bolognese',
    description: 'Capas de pasta con carne, salsa de tomate y queso.',
    price: '14',
    category: 'Primi Piatti',
    tags: 'pasta,italiano,carne',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 25,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459101/Lasagna_Bolognese_snkbi9.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 3,
  },
  {
    name: 'Pizza Margherita',
    description: 'Pizza clásica con tomate, mozzarella y albahaca.',
    price: '12',
    category: 'Pizze',
    tags: 'pizza,vegetariano',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 20,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459102/Pizza_Margherita_pgop3d.jpg',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 1,
  },
  {
    name: 'Pizza Pepperoni',
    description: 'Pizza con salsa de tomate, pepperoni y mozzarella.',
    price: '14',
    category: 'Pizze',
    tags: 'pizza,pepperoni,italiano',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 20,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459102/Pizza_Pepperoni_cnezox.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 2,
  },
  {
    name: 'Pizza Quattro Formaggi',
    description: 'Pizza con mezcla de cuatro quesos italianos.',
    price: '14',
    category: 'Pizze',
    tags: 'pizza,queso,vegetariano',
    allergens: 'gluten,lacteos',
    prep_time_minutes: 20,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459103/PIzza_Quattro_Formaggi_hrzjsl.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 3,
  },
  {
    name: 'Tiramisú',
    description: 'Postre italiano con café y mascarpone.',
    price: '8',
    category: 'Dolci',
    tags: 'postre,cafe',
    allergens: 'lacteos,huevo,gluten',
    prep_time_minutes: 8,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459103/Tiramis%C3%BA_dtt2ns.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 1,
  },
  {
    name: 'Panna Cotta',
    description: 'Postre suave de crema con salsa de frutos rojos.',
    price: '10',
    category: 'Dolci',
    tags: 'postre,italiano,cremoso',
    allergens: 'lacteos',
    prep_time_minutes: 7,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459101/Panna_Cotta_doastn.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 2,
  },
  {
    name: 'Gelato Artesanal',
    description: 'Helado italiano tradicional en sabores de la casa.',
    price: '7',
    category: 'Dolci',
    tags: 'postre,helado,italiano',
    allergens: 'lacteos',
    prep_time_minutes: 5,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459100/Gelato_Artesanal_pgxt0r.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 3,
  },
  {
    name: 'Limonada',
    description: 'Limonada fresca de la casa.',
    price: '5',
    category: 'Bevande',
    tags: 'bebida,refrescante',
    allergens: '',
    prep_time_minutes: 5,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459100/Limonada_fresca_de_la_casa_ksbblr.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 1,
  },
  {
    name: 'Espresso',
    description: 'Café italiano fuerte y aromático.',
    price: '4',
    category: 'Bevande',
    tags: 'bebida,cafe,italiano',
    allergens: '',
    prep_time_minutes: 4,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459099/Espresso_pnp5ga.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 2,
  },
  {
    name: 'Vino Tinto',
    description: 'Copa de vino tinto seleccionada por la casa.',
    price: '7',
    category: 'Bevande',
    tags: 'bebida,vino,italiano',
    allergens: 'sulfitos',
    prep_time_minutes: 3,
    image_url:
      'https://res.cloudinary.com/dgzp5pfmp/image/upload/v1776459792/Vino_Tinto_yqcfrm.png',
    is_available: true,
    status: MenuItemStatus.AVAILABLE,
    display_order: 3,
  },
] as const;

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
  ) {}

  private async ensureMenuImagesIntegrity(): Promise<void> {
    for (const seedItem of BELLA_VITA_ITEMS) {
      const existingItem = await this.menuItemRepository.findOne({
        where: {
          restaurant_id: BELLA_VITA_RESTAURANT_ID,
          name: seedItem.name,
        },
      });

      if (!existingItem) continue;

      const needsRepair =
        !existingItem.image_url ||
        !existingItem.image_url.trim() ||
        existingItem.image_url === 'undefined';

      if (!needsRepair) continue;

      existingItem.image_url = seedItem.image_url;
      existingItem.description =
        existingItem.description || seedItem.description;
      existingItem.price = existingItem.price || seedItem.price;
      existingItem.tags = existingItem.tags || seedItem.tags;
      existingItem.allergens = existingItem.allergens ?? seedItem.allergens;
      existingItem.prep_time_minutes =
        existingItem.prep_time_minutes ?? seedItem.prep_time_minutes;
      existingItem.status = existingItem.status || seedItem.status;
      existingItem.is_available =
        typeof existingItem.is_available === 'boolean'
          ? existingItem.is_available
          : seedItem.is_available;
      existingItem.display_order =
        existingItem.display_order ?? seedItem.display_order;

      await this.menuItemRepository.save(existingItem);
    }
  }

  // =========================
  // PUBLIC
  // =========================
  async getPublicMenu(restaurantId: string) {
    await this.ensureMenuImagesIntegrity();

    const categories = await this.menuCategoryRepository.find({
        where: {
            restaurant_id: restaurantId,
            is_active: true,
        },
        order: {
            display_order: 'ASC',
            created_at: 'ASC',
        },
    });

    const result = await Promise.all(
        categories.map(async (category) => {
            const items = await this.menuItemRepository.find({
                where: {
                    restaurant_id: restaurantId,
                    category_id: category.id,
                    status: MenuItemStatus.AVAILABLE,
                    is_available: true,
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
    await this.ensureMenuImagesIntegrity();

    const categories = await this.menuCategoryRepository.find({
      where: {
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
      },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });

    const result = await Promise.all(
      categories.map(async (category) => {
        const items = await this.menuItemRepository.find({
          where: {
            restaurant_id: BELLA_VITA_RESTAURANT_ID,
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
          is_active: category.is_active,
          display_order: category.display_order,
          items,
        };
      }),
    );

    return result;
  }

  // =========================
  // CATEGORY METHODS
  // =========================
  async createCategory(dto: CreateMenuCategoryDto): Promise<MenuCategory> {
    const existing = await this.menuCategoryRepository.findOne({
      where: {
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
        name: dto.name,
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una categoría con ese nombre.');
    }

    const category = this.menuCategoryRepository.create({
      ...dto,
      restaurant_id: BELLA_VITA_RESTAURANT_ID,
      is_active: true,
    });

    return await this.menuCategoryRepository.save(category);
  }

  async findAllCategories(): Promise<MenuCategory[]> {
    return await this.menuCategoryRepository.find({
      where: {
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
        is_active: true,
      },
      order: {
        display_order: 'ASC',
        created_at: 'ASC',
      },
    });
  }

  async findOneCategory(id: string): Promise<MenuCategory> {
    const category = await this.menuCategoryRepository.findOne({
      where: {
        id,
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
      },
    });

    if (!category) {
      throw new NotFoundException(`No se encontró la categoría con id ${id}`);
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateMenuCategoryDto,
  ): Promise<MenuCategory> {
    const category = await this.findOneCategory(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.menuCategoryRepository.findOne({
        where: {
          restaurant_id: BELLA_VITA_RESTAURANT_ID,
          name: dto.name,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Ya existe una categoría con ese nombre.',
        );
      }
    }

    Object.assign(category, dto);

    return await this.menuCategoryRepository.save(category);
  }

  async removeCategory(id: string): Promise<string> {
    const category = await this.findOneCategory(id);

    const relatedItemsCount = await this.menuItemRepository.count({
      where: {
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
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
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
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
      restaurant_id: BELLA_VITA_RESTAURANT_ID,
      category_id: category.id,
      price: String(dto.price),
      status: dto.status ?? MenuItemStatus.AVAILABLE,
      is_available:
        dto.status != null ? dto.status === MenuItemStatus.AVAILABLE : true,
    });

    return await this.menuItemRepository.save(item);
  }

  async findAllItems(query: QueryMenuItemsDto) {
    const qb = this.menuItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.restaurant_id = :restaurant_id', {
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
      });

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

    return await qb
      .orderBy('category.display_order', 'ASC')
      .addOrderBy('item.display_order', 'ASC')
      .addOrderBy('item.created_at', 'ASC')
      .getMany();
  }

  async findOneItem(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: {
        id,
        restaurant_id: BELLA_VITA_RESTAURANT_ID,
      },
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
          restaurant_id: BELLA_VITA_RESTAURANT_ID,
          is_active: true,
        },
      });

      if (!category) {
        throw new BadRequestException(
          'La nueva categoría no existe o está inactiva.',
        );
      }

      item.category_id = category.id;
      item.category = category;
    }

    Object.assign(item, dto);

    if (dto.price !== undefined) {
      item.price = String(dto.price);
    }

    if (dto.status) {
      item.is_available = dto.status === MenuItemStatus.AVAILABLE;
    }

    return await this.menuItemRepository.save(item);
  }

  async updateItemStatus(
    id: string,
    status: MenuItemStatus,
  ): Promise<MenuItem> {
    const item = await this.findOneItem(id);

    item.status = status;
    item.is_available = status === MenuItemStatus.AVAILABLE;

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
    const restaurantId = BELLA_VITA_RESTAURANT_ID;
    const savedCategories: Record<string, MenuCategory> = {};

    let categoriesCreated = 0;
    let categoriesUpdated = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;

    for (const cat of BELLA_VITA_CATEGORIES) {
      let category = await this.menuCategoryRepository.findOne({
        where: {
          restaurant_id: restaurantId,
          name: cat.name,
        },
      });

      if (category) {
        let changed = false;

        if (category.description !== `Categoría ${cat.name}`) {
          category.description = `Categoría ${cat.name}`;
          changed = true;
        }

        if (category.display_order !== cat.display_order) {
          category.display_order = cat.display_order;
          changed = true;
        }

        if (category.is_active !== true) {
          category.is_active = true;
          changed = true;
        }

        if (changed) {
          category = await this.menuCategoryRepository.save(category);
          categoriesUpdated++;
        }
      } else {
        category = this.menuCategoryRepository.create({
          restaurant_id: restaurantId,
          name: cat.name,
          description: `Categoría ${cat.name}`,
          display_order: cat.display_order,
          is_active: true,
        });

        category = await this.menuCategoryRepository.save(category);
        categoriesCreated++;
      }

      savedCategories[cat.name] = category;
    }

    for (const seedItem of BELLA_VITA_ITEMS) {
      const category = savedCategories[seedItem.category];

      if (!category) continue;

      let item = await this.menuItemRepository.findOne({
        where: {
          restaurant_id: restaurantId,
          name: seedItem.name,
        },
      });

      if (item) {
        let changed = false;

        if (item.category_id !== category.id) {
          item.category_id = category.id;
          item.category = category;
          changed = true;
        }

        if (item.description !== seedItem.description) {
          item.description = seedItem.description;
          changed = true;
        }

        if (String(item.price) !== String(seedItem.price)) {
          item.price = String(seedItem.price);
          changed = true;
        }

        if (item.image_url !== seedItem.image_url) {
          item.image_url = seedItem.image_url;
          changed = true;
        }

        if (item.tags !== seedItem.tags) {
          item.tags = seedItem.tags;
          changed = true;
        }

        if (item.allergens !== seedItem.allergens) {
          item.allergens = seedItem.allergens;
          changed = true;
        }

        if (item.prep_time_minutes !== seedItem.prep_time_minutes) {
          item.prep_time_minutes = seedItem.prep_time_minutes;
          changed = true;
        }

        if (item.status !== seedItem.status) {
          item.status = seedItem.status;
          changed = true;
        }

        if (item.is_available !== seedItem.is_available) {
          item.is_available = seedItem.is_available;
          changed = true;
        }

        if (item.display_order !== seedItem.display_order) {
          item.display_order = seedItem.display_order;
          changed = true;
        }

        if (changed) {
          await this.menuItemRepository.save(item);
          itemsUpdated++;
        }
      } else {
        item = this.menuItemRepository.create({
          restaurant_id: restaurantId,
          category_id: category.id,
          category,
          name: seedItem.name,
          description: seedItem.description,
          price: String(seedItem.price),
          image_url: seedItem.image_url,
          is_available: seedItem.is_available,
          allergens: seedItem.allergens,
          tags: seedItem.tags,
          prep_time_minutes: seedItem.prep_time_minutes,
          status: seedItem.status,
          display_order: seedItem.display_order,
        });

        await this.menuItemRepository.save(item);
        itemsCreated++;
      }
    }

    await this.ensureMenuImagesIntegrity();

    return {
      message: 'Seed del menú ejecutado correctamente',
      categories_created: categoriesCreated,
      categories_updated: categoriesUpdated,
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      total_categories_seed: BELLA_VITA_CATEGORIES.length,
      total_items_seed: BELLA_VITA_ITEMS.length,
    };
  }
}
