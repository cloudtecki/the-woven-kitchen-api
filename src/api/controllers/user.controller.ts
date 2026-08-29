import { Request, Response } from 'express';
import { container } from '../../infrastructure/di';
import { TYPES } from '../../shared/constants/tokens';
import { asyncHandler, successResponse, createdResponse, paginatedResponse } from '../../shared/utils';
import { CreateUserHandler } from '../../application/handlers/create-user.handler';
import { UpdateUserHandler } from '../../application/handlers/update-user.handler';
import { DeleteUserHandler } from '../../application/handlers/delete-user.handler';
import { GetUserByIdHandler } from '../../application/handlers/get-user-by-id.handler';
import { GetAllUsersHandler } from '../../application/handlers/get-all-users.handler';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { DeleteUserCommand } from '../../application/commands/delete-user.command';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query';
import { GetAllUsersQuery } from '../../application/queries/get-all-users.query';
import { CreateUserInput, UpdateUserInput, UserQueryInput, UserIdParamsInput } from '../../application/dto/user.dto';

const getUserByIdHandler = (): GetUserByIdHandler => container.get<GetUserByIdHandler>(TYPES.GetUserByIdHandler);
const getAllUsersHandler = (): GetAllUsersHandler => container.get<GetAllUsersHandler>(TYPES.GetAllUsersHandler);
const createUserHandler = (): CreateUserHandler => container.get<CreateUserHandler>(TYPES.CreateUserHandler);
const updateUserHandler = (): UpdateUserHandler => container.get<UpdateUserHandler>(TYPES.UpdateUserHandler);
const deleteUserHandler = (): DeleteUserHandler => container.get<DeleteUserHandler>(TYPES.DeleteUserHandler);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as UserQueryInput;
  const result = await getAllUsersHandler().execute(new GetAllUsersQuery(page, limit));
  paginatedResponse(res, result.data, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParamsInput;
  const user = await getUserByIdHandler().execute(new GetUserByIdQuery(id));
  successResponse(res, user);
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, STAFF]
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: User already exists
 *       400:
 *         description: Validation error
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateUserInput;
  const user = await createUserHandler().execute(
    new CreateUserCommand(data.email, data.name, data.role)
  );
  createdResponse(res, user, 'User created successfully');
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParamsInput;
  const data = req.body as UpdateUserInput;
  const user = await updateUserHandler().execute(
    new UpdateUserCommand(id, data.name, data.role, data.isActive)
  );
  successResponse(res, user, 'User updated successfully');
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as UserIdParamsInput;
  await deleteUserHandler().execute(new DeleteUserCommand(id));
  successResponse(res, null, 'User deleted successfully');
});
