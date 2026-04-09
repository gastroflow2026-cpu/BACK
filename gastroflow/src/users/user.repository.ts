import { BadRequestException, Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/user.dto";

@Injectable()
export class UsersRepository {
    constructor(@InjectRepository(User) private ormUsersRepository: Repository<User>) {}


    async createUser(newUserData: CreateUserDto): Promise<string> {

    const existingUser = await this.getUserByEmail(newUserData.email);
    if (existingUser) {
      throw new BadRequestException(`El email ${newUserData.email} ya está registrado`);
    }
    const user = this.ormUsersRepository.create(newUserData);
    const savedUser = await this.ormUsersRepository.save(user);
    return savedUser.id;
    }
    
    async getUserByEmail(email: string): Promise<User | null> {
        return await this.ormUsersRepository.findOneBy({ email: email });
    }
}