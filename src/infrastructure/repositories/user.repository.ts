import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { UserModel, UserDocument } from '../database/models/user.model';
import { IUserRepository, CreateUserData, UpdateUserData, FindAllResult } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role';

@injectable()
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await UserModel.findById(id).lean();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findAll(page = 1, limit = 20): Promise<FindAllResult> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      UserModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(),
    ]);
    return { data: docs.map((doc) => this.mapToEntity(doc)), total };
  }

  async create(data: CreateUserData): Promise<User> {
    const doc = await UserModel.create({
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      isActive: data.isActive,
    });
    return this.mapToEntity(doc.toObject());
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const patch: Record<string, unknown> = {};
    if (data.email !== undefined) patch.email = data.email.toLowerCase();
    if (data.name !== undefined) patch.name = data.name;
    if (data.role !== undefined) patch.role = data.role;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    const doc = await UserModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? this.mapToEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await UserModel.findByIdAndDelete(id);
    return result !== null;
  }

  async count(): Promise<number> {
    return UserModel.countDocuments();
  }

  private mapToEntity(doc: UserDocument | Record<string, any>): User {
    return {
      id: String(doc._id),
      email: (doc as any).email,
      name: (doc as any).name,
      role: (doc as any).role as UserRole,
      isActive: (doc as any).isActive,
      createdAt: (doc as any).createdAt || new Date(),
      updatedAt: (doc as any).updatedAt || new Date(),
    };
  }
}
