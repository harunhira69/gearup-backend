import { Request, Response } from "express";
import httpStatus from "http-status";
import { RentalStatus } from "../../../generated/prisma/enums";
import { catchAsync } from "../../utils/catchAsync";
import { createError } from "../../utils/createError";
import { sendResponse } from "../../utils/sendResonse";
import { providerService } from "./provider.service";

const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.id;

  if (!providerId) {
    throw createError(
      "Provider information not found in request",
      httpStatus.UNAUTHORIZED
    );
  }

  const result = await providerService.getProviderOrdersFromDB(providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Provider rental orders retrieved successfully",
    data: result,
  });
});

const updateProviderOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    const rentalOrderId = req.params.id as string;
    const { status } = req.body;

    if (!providerId) {
      throw createError(
        "Provider information not found in request",
        httpStatus.UNAUTHORIZED
      );
    }

    if (!rentalOrderId) {
      throw createError("Rental order ID is required", httpStatus.BAD_REQUEST, {
        field: "id",
        message: "Rental order ID is required",
      });
    }

    const result = await providerService.updateProviderOrderStatusIntoDB(
      rentalOrderId,
      providerId,
      status as RentalStatus
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental order status updated successfully",
      data: result,
    });
  }
);

export const providerController = {
  getProviderOrders,
  updateProviderOrderStatus,
};