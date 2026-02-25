import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
        if (!requiredPermissions) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userBuffer = request.user; // Set by AuthMiddleware/JwtStrategy

        if (!userBuffer || !userBuffer.roleCode) {
            throw new ForbiddenException('User missing roles/permissions');
        }

        // Role-Permission mapping logic (simplified for output)
        const permissionsMap = {
            'ADMIN': ['PARAM_VIEW', 'PARAM_EDIT', 'PARAM_APPROVE', 'PROFILE_CREATE', 'PROFILE_ACTIVATE', 'PROFILE_SIMULATE', 'AUDIT_VIEW'],
            'COMPLIANCE_OFFICER': ['PARAM_VIEW', 'PARAM_APPROVE', 'PROFILE_ACTIVATE', 'AUDIT_VIEW'],
            'RISK_MANAGER': ['PARAM_VIEW', 'PARAM_EDIT', 'PROFILE_CREATE', 'PROFILE_SIMULATE'],
            'AUDITOR': ['PARAM_VIEW', 'AUDIT_VIEW'],
            'SYSTEM_READONLY': ['PARAM_VIEW']
        };

        const userPermissions = permissionsMap[userBuffer.roleCode] || [];
        const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
