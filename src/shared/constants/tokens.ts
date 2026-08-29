export const TYPES = {
  UserRepository: Symbol.for('IUserRepository'),
  CreateUserHandler: Symbol.for('CreateUserHandler'),
  UpdateUserHandler: Symbol.for('UpdateUserHandler'),
  DeleteUserHandler: Symbol.for('DeleteUserHandler'),
  GetUserByIdHandler: Symbol.for('GetUserByIdHandler'),
  GetAllUsersHandler: Symbol.for('GetAllUsersHandler'),
} as const;
