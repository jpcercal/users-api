import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

export const errorHandler = (
  error: { status: number; message: string; errors: [] },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json({
    message: error.message || 'Internal server error',
    errors: error.errors || [],
  });
};
