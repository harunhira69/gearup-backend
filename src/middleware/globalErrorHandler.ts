import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import { ZodError } from "zod";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Error:", err);

  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  let errorDetails =
    err.errorDetails || {
      path: req.originalUrl,
      method: req.method,
    };

    if (err instanceof ZodError) {
  statusCode = httpStatus.BAD_REQUEST;
  message = "Validation failed";
  errorDetails = err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
} else if (err.name === "ValidationError") {
  statusCode = httpStatus.BAD_REQUEST;
  message = err.message || "Validation failed";
  errorDetails = err.errorDetails;
}

  if (err.name === "ValidationError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = err.message || "Validation failed";
    errorDetails = err.errorDetails;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "You have provided incorrect field type or missing fields";
    errorDetails = {
      type: "PrismaClientValidationError",
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      message = "Duplicate value already exists";
      errorDetails = {
        code: err.code,
        target: err.meta?.target,
      };
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      message = "Foreign key constraint failed";
      errorDetails = {
        code: err.code,
        field: err.meta?.field_name,
      };
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      message = "Requested resource not found";
      errorDetails = {
        code: err.code,
        cause: err.meta?.cause,
      };
    } else {
      statusCode = httpStatus.BAD_REQUEST;
      message = "Database request failed";
      errorDetails = {
        code: err.code,
        meta: err.meta,
      };
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      message = "Authentication failed against database server";
      errorDetails = {
        code: err.errorCode,
      };
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      message = "Cannot reach database server";
      errorDetails = {
        code: err.errorCode,
      };
    } else {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      message = "Database initialization error";
      errorDetails = {
        code: err.errorCode,
      };
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Error occurred during query execution";
    errorDetails = {
      type: "PrismaClientUnknownRequestError",
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "An unexpected database engine error occurred. Please try again later.";
    errorDetails = {
      type: "PrismaClientRustPanicError",
    };
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};