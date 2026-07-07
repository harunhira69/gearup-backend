import httpStatus from "http-status";

export const createError = (
  message: string,
  statusCode: number,
  errorDetails?: unknown
) => {
  const error = new Error(message) as Error & {
    statusCode?: number;
    errorDetails?: unknown;
  };

  error.statusCode = statusCode;

  if (errorDetails) {
    error.errorDetails = errorDetails;
  }

  return error;
};

export const createValidationError = (
  errors: { field: string; message: string }[]
) => {
  const error = new Error("Validation failed") as Error & {
    statusCode?: number;
    errorDetails?: unknown;
  };

  error.name = "ValidationError";
  error.statusCode = httpStatus.BAD_REQUEST;
  error.errorDetails = errors;

  return error;
};