import { Request, Response, NextFunction } from 'express';

// Centralized error handling middleware
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Simple typed guard for expected errors
  if (err instanceof Error) {
    // Basic example: you can extend with custom error classes/status codes
    const status = 500;
    res.status(status).json({
      error: err.name || 'InternalServerError',
      message: err.message || 'An unexpected error occurred.',
    });
    return;
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred.',
  });
}

