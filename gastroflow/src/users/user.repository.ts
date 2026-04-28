import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ResetPasswordDto, UpdateUserDto } from "./dto/user.dto";
import * as bcrypt from 'bcrypt';
import { UserRole } from "../common/user.enums";
import { PasswordResetToken } from "./entities/password-reset-token.entity";

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(User) private ormUsersRepository: Repository<User>,
        @InjectRepository(PasswordResetToken) private tokenRepository: Repository<PasswordResetToken>) {}

    async getAllUsers(page: number, limit: number): Promise<Omit<User, 'password_hash'>[]> {
        const skip = (page - 1) * limit;
        const allUsers = await this.ormUsersRepository.find({
            skip: skip,
            take: limit,
        });

        return allUsers.map(({ password_hash, ...userNoPassword }) => userNoPassword);
    }

    async getEmployeesByRestaurantId(restaurantId: string): Promise<User[]> {
        return this.ormUsersRepository.find({
            where: {
                restaurant_id: restaurantId,
                role: In([UserRole.CHEF, UserRole.CASHIER, UserRole.WAITER]),
            },
            order: {
                created_at: 'DESC',
            },
        });
    }

    async getEmployeeById(id: string): Promise<User | null> {
        return this.ormUsersRepository.findOne({
            where: {
                id,
                role: In([UserRole.CHEF, UserRole.CASHIER, UserRole.WAITER]),
            },
        });
    }

    async getEmployeeByIdAndRestaurantId(id: string, restaurantId: string): Promise<User | null> {
        return this.ormUsersRepository.findOne({
            where: {
                id,
                restaurant_id: restaurantId,
                role: In([UserRole.CHEF, UserRole.CASHIER, UserRole.WAITER]),
            },
        });
    }

    async updateUserStatus(id: string, isActive: boolean): Promise<User> {
        const user = await this.ormUsersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException(`No existe usuario con id ${id}`);
        user.is_active = isActive;
        return this.ormUsersRepository.save(user);
    }

    async createUser(newUserData: Partial<User>): Promise<string> {
        const user = this.ormUsersRepository.create(newUserData);
        const savedUser = await this.ormUsersRepository.save(user);

        return savedUser.id;
    }

    async createUserEntity(newUserData: Partial<User>): Promise<User> {
        const user = this.ormUsersRepository.create(newUserData);
        return await this.ormUsersRepository.save(user);
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


    async saveResetToken(user_id: string, token: string, expires_at: Date): Promise<void> {
    await this.tokenRepository.save({ user_id, token, expires_at });
    }

    async findResetToken(token: string): Promise<PasswordResetToken | null> {
    return this.tokenRepository.findOneBy({ token });
    }

    async markTokenAsUsed(token: PasswordResetToken): Promise<void> {
    token.used = true;
    await this.tokenRepository.save(token);
    }

}
