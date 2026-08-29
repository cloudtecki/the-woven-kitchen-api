import { BaseEntity } from './base.entity';
import { UserRole } from '../value-objects/user-role';

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}
