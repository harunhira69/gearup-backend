import { Request, Response } from "express";
import httpStatus from "http-status";

import { rentalService } from "./rental.service";
import { catchAsync } from "../../utils/catchAsync";
import { createError } from "../../utils/createError";
import { sendResponse } from "../../utils/sendResonse";


const createRental = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await rentalService.createRentalIntoDB(req.body, customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Rental order placed successfully",
    data: result,
  });
});






const getMyRentals = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await rentalService.getMyRentalsFromDB(customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental orders retrieved successfully",
    data: result,
  });
});

const getSingleRental = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;
  const rentalId = req.params.id as string;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  if (!rentalId) {
    throw createError("Rental ID is required", httpStatus.BAD_REQUEST, {
      field: "id",
      message: "Rental ID is required",
    });
  }

  const result = await rentalService.getSingleRentalFromDB(
    rentalId,
    customerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental order details retrieved successfully",
    data: result,
  });
});

export const rentalController = {
  createRental,
  getMyRentals,
  getSingleRental,
};