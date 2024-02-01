import * as express from 'express';
import { UserController } from '../controllers/user.controller';

const UserRouter = express.Router();

UserRouter.get('/', UserController.getUsers);
UserRouter.post('/', UserController.createUser);

export { UserRouter };
