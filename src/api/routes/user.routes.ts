import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { validate } from '../../shared/middleware';
import { createUserSchema, updateUserSchema, userQuerySchema, userIdParamsSchema } from '../../application/dto/user.dto';

const router = Router();

router.get('/', validate(userQuerySchema, 'query'), getAllUsers);
router.get('/:id', validate(userIdParamsSchema, 'params'), getUserById);
router.post('/', validate(createUserSchema, 'body'), createUser);
router.put('/:id', validate(userIdParamsSchema, 'params'), validate(updateUserSchema, 'body'), updateUser);
router.delete('/:id', validate(userIdParamsSchema, 'params'), deleteUser);

export { router as userRouter };
