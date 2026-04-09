import { Controller, FileTypeValidator, MaxFileSizeValidator, Param, ParseFilePipe, ParseUUIDPipe, Post, UploadedFile } from "@nestjs/common";
import { User } from "../users/entities/user.entity";
import { FileUploadService } from "./file-upload.service";

@Controller('files')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) {}

@Post("upload-image/:id")
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
) file: Express.Multer.File): Promise<User>{
    return this.fileUploadService.uploadFile(userId, file);
}

}

