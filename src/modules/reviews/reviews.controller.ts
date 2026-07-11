import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { createError } from "../../utils/createError";
import { sendResponse } from "../../utils/sendResonse";
import { reviewService } from "./reviews.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await reviewService.createReviewIntoDB(req.body, customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

export const reviewController = {
  createReview,
};