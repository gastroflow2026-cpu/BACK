import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseEnumPipe,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { Role } from '../decorators/roles.decorators';
import { UserRole } from '../common/user.enums';
import { RestaurantDocumentType } from '../common/restaurant-document-type.enum';
import { RestaurantVerificationService } from './restaurant-verification.service';

@ApiTags('Restaurant Verification')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.REST_ADMIN)
@Controller('restaurant-verification')
export class RestaurantVerificationController {
  constructor(
    private readonly restaurantVerificationService: RestaurantVerificationService,
  ) {}

  @Post('documents/:documentType')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'documentType',
    enum: RestaurantDocumentType,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadDocument(
    @Req() req,
    @Param('documentType', new ParseEnumPipe(RestaurantDocumentType))
    documentType: RestaurantDocumentType,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'El archivo debe ser menor a 5 MB',
          }),
          new FileTypeValidator({
            fileType:
              /(application\/pdf|image\/jpeg|image\/jpg|image\/png|image\/webp)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.restaurantVerificationService.uploadDocument(
      req.user,
      documentType,
      file,
    );
  }

  @Get('documents/me')
  getMyDocuments(@Req() req) {
    return this.restaurantVerificationService.getMyDocuments(req.user);
  }
}
