import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { createError } from "../../utils/createError";
import { sendResponse } from "../../utils/sendResonse";
import { paymentService } from "./payments.service";


const createPayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.id;

  if (!customerId) {
    throw createError("Customer information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await paymentService.createCheckOutSession(
    req.body,
    customerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Checkout session created successfully",
    data: result,
  });
});

export const paymentController = {
  createPayment,
};