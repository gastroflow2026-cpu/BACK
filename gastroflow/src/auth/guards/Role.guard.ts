import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../common/user.enums";

@Injectable()

export class RolesGuard implements CanActivate{

    constructor( private readonly reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean{
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
            context.getHandler(),
            context.getClass(),
    ])
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const hasRole = () => requiredRoles.some(role => user.roles.includes(role))
        const isValid = user && user.roles && hasRole(); 
        if(!isValid){
            throw new ForbiddenException('Acceso denegado');
        }else{
            return true
        }
    }
}