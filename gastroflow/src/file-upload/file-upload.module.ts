import { Module } from "@nestjs/common";
import { FileUploadController } from "./file-upload.controller";
import { CloudinaryConfig } from "../config/cloudinary";
import { FileUploadService } from "./file-upload.service";
import { FileUploadRepository } from "./file-upload.reposiroty";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [FileUploadController],
    providers: [FileUploadService, CloudinaryConfig, FileUploadRepository],
})

export class FileUploadModule{}
