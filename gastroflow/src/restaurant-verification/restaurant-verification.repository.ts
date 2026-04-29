import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');
import { RestaurantDocumentType } from '../common/restaurant-document-type.enum';

@Injectable()
export class RestaurantVerificationRepository {
  async uploadDocument(
    file: Express.Multer.File,
    restaurantId: string,
    documentType: RestaurantDocumentType,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: `restaurant-verification/${restaurantId}`,
          public_id: documentType,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error || new Error('Error al cargar documento a Cloudinary'),
            );
          } else {
            resolve(result);
          }
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}
