import { Request, Response } from 'express';
import { dataSource } from '../app-data-source';
import { User } from '../entities/user.entity';
import httpStatus from 'http-status';

// sort direction
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

// cache options
export const usersCache = {
  id: 'users',
  milliseconds: 1000 * 60 * 1, // 1 minute
};

export class UserController {
  // it creates a new user
  static async createUser(req: Request, res: Response): Promise<Response> {
    // create user repository
    const userRepository = dataSource.getRepository(User);

    // unpack request body
    const { name, email } = req.body;

    // if user already exists, return 409
    let user = await userRepository.findOne({ where: { email } });
    if (user) {
      return res.status(httpStatus.CONFLICT).send();
    }

    // create new user
    user = new User();
    user.name = name;
    user.email = email;

    // save user
    try {
      await userRepository.save(user);
    } catch (error) {
      console.error(error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send();
    }

    // remove cache
    await dataSource.queryResultCache?.remove([
      usersCache.id + SortDirection.ASC,
      usersCache.id + SortDirection.DESC,
    ]);

    // return the created user with hydrated fields
    return res.status(httpStatus.CREATED).json(user);
  }

  // it gets all users
  static async getUsers(req: Request, res: Response): Promise<Response> {
    // default sort direction
    const defaultSortDirection = 'asc';

    // get sort direction
    const sortDirection =
      ((req.query.created || defaultSortDirection) as string).toLowerCase() ===
      'asc'
        ? SortDirection.ASC
        : SortDirection.DESC;

    // get all users
    const users = await dataSource.getRepository(User).find({
      cache: { ...usersCache, id: usersCache.id + sortDirection },
      order: {
        created: sortDirection,
      },
    });

    return res.status(httpStatus.OK).json({
      data: users,
    });
  }
}
