import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersRepository } from './user.repository';
import { AdminResetPasswordDto, ConfirmPasswordResetDto, CreateEmployeeDto, RequestPasswordResetDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '../common/user.enums';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

export interface EmployeeResponse {
    id: string;
    name: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    avatar?: string;
}

interface RequestUserPayload {
    id: string;
    roles?: UserRole[];
    restaurant_id?: string;
    restaurantId?: string;
}


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

    async getEmployees(requestUser: RequestUserPayload): Promise<EmployeeResponse[]> {
        const restaurantId = this.getRestaurantIdFromPayload(requestUser);
        const employees = await this.userRepository.getEmployeesByRestaurantId(restaurantId);
        return employees.map((employee) => this.toEmployeeResponse(employee));
    }

    async createEmployee(dto: CreateEmployeeDto, requestUser: RequestUserPayload): Promise<EmployeeResponse> {
        const restaurantId = this.getRestaurantIdFromPayload(requestUser);
        this.validateCreateEmployeeDto(dto);

        const existing = await this.userRepository.getUserByEmail(dto.email);
        if (existing) {
            throw new ConflictException(`Ya existe un usuario con el email ${dto.email}`);
        }

        const password_hash = await bcrypt.hash(dto.password, 10);
        const id = await this.userRepository.createUser({
            first_name: dto.name.trim(),
            last_name: dto.lastName.trim(),
            email: dto.email.trim().toLowerCase(),
            password_hash,
            role: this.toUserRole(dto.role),
            restaurant_id: restaurantId,
        });

        const employee = await this.userRepository.getEmployeeByIdAndRestaurantId(id, restaurantId);
        if (!employee) throw new NotFoundException(`No existe empleado con id ${id}`);

        return this.toEmployeeResponse(employee);
    }

    async updateEmployeeStatus(id: string, isActive: boolean, requestUser: RequestUserPayload): Promise<EmployeeResponse> {
        if (typeof isActive !== 'boolean') {
            throw new BadRequestException('isActive debe ser boolean');
        }

        const employee = await this.getEmployeeForRequester(id, requestUser);
        const updatedEmployee = await this.userRepository.updateUserStatus(employee.id, isActive);

        return this.toEmployeeResponse(updatedEmployee);
    }

    async resetEmployeePassword(id: string, dto: AdminResetPasswordDto, requestUser: RequestUserPayload): Promise<{ message: string }> {
        if (!dto.newPassword || dto.newPassword.length < 8 || dto.newPassword.length > 15) {
            throw new BadRequestException('newPassword debe tener entre 8 y 15 caracteres');
        }

        await this.getEmployeeForRequester(id, requestUser);

        return this.userRepository.resetPassword(id, {
            newPassword: dto.newPassword,
            confirmNewPassword: dto.newPassword,
        });
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

    private getRestaurantIdFromPayload(requestUser: RequestUserPayload): string {
        const restaurantId = requestUser.restaurant_id ?? requestUser.restaurantId;
        if (!restaurantId) {
            throw new BadRequestException('El usuario no tiene restaurante asociado');
        }

        return restaurantId;
    }

    private async getEmployeeForRequester(id: string, requestUser: RequestUserPayload): Promise<User> {
        const isSuperAdmin = requestUser.roles?.includes(UserRole.SUPER_ADMIN);
        const employee = isSuperAdmin
            ? await this.userRepository.getEmployeeById(id)
            : await this.userRepository.getEmployeeByIdAndRestaurantId(id, this.getRestaurantIdFromPayload(requestUser));

        if (!employee) {
            throw new NotFoundException(`No existe empleado con id ${id}`);
        }

        return employee;
    }

    private validateCreateEmployeeDto(dto: CreateEmployeeDto): void {
        if (!dto.name?.trim()) throw new BadRequestException('name es requerido');
        if (!dto.lastName?.trim()) throw new BadRequestException('lastName es requerido');
        if (!dto.email?.trim()) throw new BadRequestException('email es requerido');
        if (!dto.password || dto.password.length < 8) {
            throw new BadRequestException('password debe tener al menos 8 caracteres');
        }
        this.toUserRole(dto.role);
    }

    private toUserRole(role: string): UserRole {
        const rolesByFrontName: Record<string, UserRole> = {
            cocinero: UserRole.CHEF,
            cajero: UserRole.CASHIER,
            mesero: UserRole.WAITER,
        };

        const userRole = rolesByFrontName[role];
        if (!userRole) {
            throw new BadRequestException('Rol invalido. Usa cocinero, cajero o mesero');
        }

        return userRole;
    }

    private toEmployeeRole(role: UserRole): string {
        const rolesByUserRole: Record<string, string> = {
            [UserRole.CHEF]: 'cocinero',
            [UserRole.CASHIER]: 'cajero',
            [UserRole.WAITER]: 'mesero',
        };

        return rolesByUserRole[role] ?? role;
    }

    private toEmployeeResponse(employee: User): EmployeeResponse {
        return {
            id: employee.id,
            name: employee.first_name,
            lastName: employee.last_name,
            email: employee.email,
            role: this.toEmployeeRole(employee.role),
            isActive: employee.is_active,
            avatar: employee.imgUrl ?? undefined,
        };
    }

}
