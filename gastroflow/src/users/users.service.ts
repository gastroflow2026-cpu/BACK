import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './user.repository';


@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UsersRepository) {}
  

    async getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
        return this.userRepository.getAllUsers();
    }
}
