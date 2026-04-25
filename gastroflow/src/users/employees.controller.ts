import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/Auth.guard';
import { RolesGuard } from '../auth/guards/Role.guard';
import { UserRole } from '../common/user.enums';
import { Role } from '../decorators/roles.decorators';
import { CreateEmployeeDto, UpdateEmployeeStatusDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(AuthGuard, RolesGuard)
@Role(UserRole.REST_ADMIN, UserRole.SUPER_ADMIN)
export class EmployeesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empleados del restaurante' })
  getEmployees(@Req() req: any) {
    return this.usersService.getEmployees(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear empleado del restaurante' })
  createEmployee(@Body() dto: CreateEmployeeDto, @Req() req: any) {
    return this.usersService.createEmployee(dto, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activar o desactivar empleado' })
  updateEmployeeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeStatusDto,
    @Req() req: any,
  ) {
    return this.usersService.updateEmployeeStatus(id, dto.isActive, req.user);
  }
}
