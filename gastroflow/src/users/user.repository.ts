import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ResetPasswordDto, UpdateUserDto } from "./dto/user.dto";
import * as bcrypt from 'bcrypt';
import { UserRole } from "../common/user.enums";

@Injectable()
export class UsersRepository {
    constructor(@InjectRepository(User) private ormUsersRepository: Repository<User>) {}

    async getAllUsers(page: number, limit: number): Promise<Omit<User, 'password_hash'>[]> {
        const skip = (page - 1) * limit;
        const allUsers = await this.ormUsersRepository.find({
            skip: skip,
            take: limit,
        });

        return allUsers.map(({ password_hash, ...userNoPassword }) => userNoPassword);
    }

    async createUser(newUserData: Partial<User>): Promise<string> {
        const user = this.ormUsersRepository.create(newUserData);
        const savedUser = await this.ormUsersRepository.save(user);

        return savedUser.id;
    }
    
    async getUserByEmail(email: string): Promise<User | null> {
        return await this.ormUsersRepository.findOneBy({ email });
    }

    async getUserById(id: string): Promise<Omit<User, 'password_hash'>> {
        const user = await this.ormUsersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`No se encontró el usuario con id ${id}`);
        const { password_hash, ...rest } = user;

        return rest;
    } 

    async updateUser(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password_hash'>> {
        const user = await this.ormUsersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
        const merged = this.ormUsersRepository.merge(user, dto);
        const saved = await this.ormUsersRepository.save(merged);
        const { password_hash, ...rest } = saved;

        return rest;
    }

    async updateRole(id: string, role: UserRole): Promise<Omit<User, 'password_hash'>> {
        const user = await this.ormUsersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
        user.role = role;
        const saved = await this.ormUsersRepository.save(user);
        const { password_hash, ...rest } = saved;

        return rest;
    } 

    async deleteUser(id: string): Promise<{ message: string }> {
        const user = await this.ormUsersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
        await this.ormUsersRepository.softDelete(id);

        return { message: `Usuario con id ${id} eliminado correctamente` };
    }

    async deactivateUser(id: string): Promise<{ message: string }> {
        const user = await this.ormUsersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
        user.is_active = false;
        await this.ormUsersRepository.save(user);

        return { message: `Usuario con id ${id} desactivado correctamente` };
    }

    async resetPassword(id: string, dto: ResetPasswordDto): Promise<{ message: string }> {
        const { newPassword } = dto;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const foundUser = await this.ormUsersRepository.findOneBy({ id });
        if (!foundUser) throw new NotFoundException(`No existe usuario con id ${id}`);
        foundUser.password_hash = hashedPassword;
        const savedUser = await this.ormUsersRepository.save(foundUser);
        return { message: `Contraseña modificada correctamente` };
    }

}