export class AppError extends Error {
  constructor(status, message, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  const isUnexpected = status >= 500;
  if (isUnexpected) console.error(error);
  res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: isUnexpected ? 'Something went wrong on the server.' : error.message,
    },
  });
}
