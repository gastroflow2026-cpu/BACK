import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UsersRepository {
    constructor(@InjectRepository(User) private ormUsersRepository: Repository<User>) {}


    async createUser(newUserData: Partial<User>): Promise<string> {
       
    const user = this.ormUsersRepository.create(newUserData);
    const savedUser = await this.ormUsersRepository.save(user);
    return savedUser.id;
    }
    
    async getUserByEmail(email: string): Promise<User | null> {
        return await this.ormUsersRepository.findOneBy({ email: email });
    }
}