import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../common/user.enums";


export const Role = (...roles: UserRole[]) => SetMetadata('roles', roles); 
// METADATA: Diccionario asociado a cada request recibida