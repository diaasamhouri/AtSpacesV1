import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY, SECTION_KEY, ROLE_PERMISSIONS, AdminSection } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Check role-based access
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) return false;

    // ADMIN always has full access
    if (user.role === Role.ADMIN) return true;

    // Check if user's role is in the required roles list
    if (!requiredRoles.includes(user.role)) return false;

    // Check section-level permissions
    const requiredSection = this.reflector.getAllAndOverride<AdminSection>(
      SECTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredSection) return true;

    const allowedSections = ROLE_PERMISSIONS[user.role] || [];
    return allowedSections.includes(requiredSection);
  }
}
