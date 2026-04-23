import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './user.repository';
import { ConfirmPasswordResetDto, CreateEmployeeDto, RequestPasswordResetDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '../common/user.enums';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';


@Injectable()
export class UsersService {
    constructor(
        private readonly userRepository: UsersRepository,
        private readonly mailService: MailService,
    ) {}
  

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
      first_name: dto.first_name,
      last_name: dto.last_name, 
      email: dto.email,
      password_hash,
      role: dto.role,
      restaurant_id: dto.restaurant_id,
    });

    return { id };
    }

    async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ message: string }> {
        const genericMsg = { message: 'Si el email existe, recibirás un enlace en breve.' };
  
        const user = await this.userRepository.getUserByEmail(dto.email);
        console.log('Usuario encontrado:', user); 
        if (!user) return genericMsg; // No revelar si el email existe

        const token = crypto.randomUUID();
        const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await this.userRepository.saveResetToken(user.id, token, expires_at);
        console.log('Enviando email a:', user.email);
        await this.mailService.sendPasswordResetEmail(user.email, user.first_name, token);

        return genericMsg;
    }

    async confirmPasswordReset(dto: ConfirmPasswordResetDto): Promise<{ message: string }> {
        const record = await this.userRepository.findResetToken(dto.token);

        if (!record || record.used || record.expires_at < new Date()) {
        throw new BadRequestException('Token inválido o expirado.');
        }

        await this.userRepository.resetPassword(record.user_id, { 
        newPassword: dto.newPassword,
        confirmNewPassword: dto.confirmNewPassword,
        });
        await this.userRepository.markTokenAsUsed(record);

        return { message: 'Contraseña actualizada correctamente.' };
    }

}
