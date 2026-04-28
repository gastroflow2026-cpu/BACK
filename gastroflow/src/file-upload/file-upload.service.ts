import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import { FileUploadRepository } from "./file-upload.repository";
import { UploadApiResponse } from "cloudinary";

@Injectable()
export class FileUploadService {
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ){}
  async uploadFile(userId: string, file: Express.Multer.File): Promise<string>{

    const foundUser = await this.userRepository.findOneBy({id: userId});
    if(!foundUser) throw new NotFoundException(`User with id: ${userId} not found`)

    const response = await this.fileUploadRepository.uploadImage(file);

    foundUser.imgUrl = response.secure_url;
    await this.userRepository.save(foundUser);
    
    const updatedUser = await this.userRepository.findOneBy({id: userId});
    if(!updatedUser) throw NotFoundException;
    return response.url;
  }

}