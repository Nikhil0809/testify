import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, errors.array()[0].msg));
  }
  next();
};

// Centralized error handler
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  }
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value for a unique field';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (statusCode === 500) {
    console.error(err);
    message = 'Internal server error';
  }

  res.status(statusCode).json({ success: false, message });
};
