import { ConflictException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './user.repository';
import { CreateEmployeeDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '../common/user.enums';
import * as bcrypt from 'bcrypt';


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

    async createEmployee(dto: CreateEmployeeDto): Promise<{ id: string }> {
    const existing = await this.userRepository.getUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Ya existe un usuario con el email ${dto.email}`);
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const id = await this.userRepository.createUser({
      first_name: dto.name,
      email: dto.email,
      password_hash,
      role: dto.role,
      restaurant_id: dto.restaurant_id,
    });

    return { id };
  }

}
