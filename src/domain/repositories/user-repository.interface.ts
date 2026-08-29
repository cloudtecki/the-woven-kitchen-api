import { User } from '../entities/user.entity';
import { UserRole } from '../value-objects/user-role';

export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface FindAllResult {
  data: User[];
  total: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page?: number, limit?: number): Promise<FindAllResult>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
