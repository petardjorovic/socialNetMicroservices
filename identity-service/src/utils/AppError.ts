export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(msg: string, statusCode = 500, isOperational = true) {
    super(msg);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(msg = "Resource not found") {
    super(msg, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(msg = "Bad request") {
    super(msg, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = "Unauthorized") {
    super(msg, 401);
  }
}
