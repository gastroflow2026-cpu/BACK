import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './user.repository';
import { ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '../common/user.enums';


@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UsersRepository) {}
  

    async getAllUsers(page: number, limit: number): Promise<Omit<User, 'password_hash'>[]> {
        return this.userRepository.getAllUsers(page, limit);
    }

    async getUserById(id: string) {
        return this.userRepository.getUserById(id)
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        return this.userRepository.updateUser(id, dto)
    }

    async updateRole(id: string, role: UserRole) {
        return this.userRepository.updateRole(id, role);
    }

    async deleteUser(id: string) {
        return this.userRepository.deleteUser(id);
    }

    async deactivateUser(id: string) {
        return this.userRepository.deactivateUser(id);
    }

    async resetPassword(id: string, dto: ResetPasswordDto) {
        return this.userRepository.resetPassword(id, dto)

    }
}
