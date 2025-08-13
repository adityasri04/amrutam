import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id
  });

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const message = 'Database operation failed';
    error = { message, statusCode: 400 } as AppError;
  }

  if (err.name === 'PrismaClientValidationError') {
    const message = 'Validation error';
    error = { message, statusCode: 400 } as AppError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 } as AppError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 } as AppError;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    error = { message, statusCode: 400 } as AppError;
  }

  // Cast errors (MongoDB)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = { message, statusCode: 400 } as AppError;
  }

  // Duplicate key errors
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value';
    error = { message, statusCode: 400 } as AppError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
