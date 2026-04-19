import { Controller, FileTypeValidator, HttpCode, MaxFileSizeValidator, Param, ParseFilePipe, ParseUUIDPipe, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileUploadService } from "./file-upload.service";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { RolesGuard } from "../auth/guards/Role.guard";
import { Role } from "../decorators/roles.decorators";
import { UserRole } from "../common/user.enums";

@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.REST_ADMIN)
@ApiTags('File-Uploads')
@Controller('files')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) {}

@Post("upload-image/:id")
@HttpCode(201)
@ApiOperation({summary: 'Carga de imágen para un usuario en específico por ID'})
@ApiParam({
      name:'id',
      type: String,
      description: 'ID del usuario formato UUID v4'
    })
@ApiConsumes('multipart/form-data')
@ApiBody({
    schema: {
        type: 'object',
        properties: {
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    }
})

@ApiResponse({
    status: 201,
    description: 'La imágen fue cargada correctamente'
})
@ApiResponse({
    status: 400,
    description: 'No se pudo actualizar la imágen'
})
@ApiResponse({
    status: 404,
    description: 'No se encontró producto con el ID enviado'
})
@ApiResponse({
    status: 401,
    description: 'No autenticado'
})
  @ApiResponse({
    status: 403,
    description: 'No autorizado'
})
@UseInterceptors(FileInterceptor('file'))
async uploadImage(
@Param('id', ParseUUIDPipe) userId: string, 
@UploadedFile(
    new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({
                maxSize: 200 * 1024, // 200 KB
                message: 'El archivo debe ser menor a 200 KB',
            }),
            new FileTypeValidator({
                fileType: /.(jpg|jpeg|png|webp|svg)/
            })
        ] 
    })
) file: Express.Multer.File): Promise<string>{
    return this.fileUploadService.uploadFile(userId, file);
}

}

