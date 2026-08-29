import { Container } from 'inversify';
import { TYPES } from '../../shared/constants/tokens';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserHandler } from '../../application/handlers/create-user.handler';
import { UpdateUserHandler } from '../../application/handlers/update-user.handler';
import { DeleteUserHandler } from '../../application/handlers/delete-user.handler';
import { GetUserByIdHandler } from '../../application/handlers/get-user-by-id.handler';
import { GetAllUsersHandler } from '../../application/handlers/get-all-users.handler';

const container = new Container();

container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<CreateUserHandler>(TYPES.CreateUserHandler).to(CreateUserHandler);
container.bind<UpdateUserHandler>(TYPES.UpdateUserHandler).to(UpdateUserHandler);
container.bind<DeleteUserHandler>(TYPES.DeleteUserHandler).to(DeleteUserHandler);
container.bind<GetUserByIdHandler>(TYPES.GetUserByIdHandler).to(GetUserByIdHandler);
container.bind<GetAllUsersHandler>(TYPES.GetAllUsersHandler).to(GetAllUsersHandler);

export { container };
