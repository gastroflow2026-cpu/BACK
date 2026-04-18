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
      // =========================
      // ANTIPASTI
      // =========================
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
        description:
          'Tomate fresco, mozzarella y albahaca con aceite de oliva.',
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

      // =========================
      // PRIMI PIATTI
      // =========================
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

      // =========================
      // PIZZE
      // =========================
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

      // =========================
      // DOLCI
      // =========================
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

      // =========================
      // BEVANDE
      // =========================
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
