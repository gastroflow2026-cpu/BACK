import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantDocumentType } from '../common/restaurant-document-type.enum';
import { RestaurantVerificationDocument } from './entities/restaurant-verification-document.entity';
import { RestaurantVerificationRepository } from './restaurant-verification.repository';

interface AuthenticatedUserPayload {
  id: string;
  restaurant_id?: string | null;
}

@Injectable()
export class RestaurantVerificationService {
  constructor(
    @InjectRepository(RestaurantVerificationDocument)
    private readonly documentRepository: Repository<RestaurantVerificationDocument>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    private readonly uploadRepository: RestaurantVerificationRepository,
  ) {}

  async uploadDocument(
    user: AuthenticatedUserPayload,
    documentType: RestaurantDocumentType,
    file: Express.Multer.File,
  ) {
    if (!user.restaurant_id) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante vinculado',
      );
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: user.restaurant_id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const uploadResponse = await this.uploadRepository.uploadDocument(
      file,
      restaurant.id,
      documentType,
    );

    let document = await this.documentRepository.findOne({
      where: {
        restaurant_id: restaurant.id,
        document_type: documentType,
      },
    });

    if (!document) {
      document = this.documentRepository.create({
        restaurant_id: restaurant.id,
        document_type: documentType,
      });
    }

    document.file_url = uploadResponse.secure_url;
    document.file_public_id = uploadResponse.public_id;
    document.original_name = file.originalname;
    document.mime_type = file.mimetype;
    document.size = file.size;
    document.uploaded_by_user_id = user.id;

    return await this.documentRepository.save(document);
  }

  async uploadRestaurantImage(user: AuthenticatedUserPayload, file: Express.Multer.File) {
  if (!user.restaurant_id) {
    throw new BadRequestException('El usuario no tiene un restaurante vinculado');
  }

  const uploadResponse = await this.uploadRepository.uploadDocument(
    file,
    user.restaurant_id,
    'restaurant_image' as any,
  );

  await this.restaurantRepository.update(
    { id: user.restaurant_id },
    { image_url: uploadResponse.secure_url },
  );

  return { image_url: uploadResponse.secure_url };
  }

  async getMyDocuments(user: AuthenticatedUserPayload) {
    if (!user.restaurant_id) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante vinculado',
      );
    }

    return await this.documentRepository.find({
      where: {
        restaurant_id: user.restaurant_id,
      },
      order: {
        created_at: 'ASC',
      },
    });
  }
}
