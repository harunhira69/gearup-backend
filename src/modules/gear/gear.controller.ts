import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { gearService } from "./gear.service";
import { sendResponse } from "../../utils/sendResonse";
import httpStatus from "http-status";
import { createError } from "../../utils/createError";
import { GearFilterQuery } from "./gear.interface";

const getAllGear = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GearFilterQuery;
  console.log(req.query)
  const result = await gearService.getAllGearFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear Item Retrieved successfully",
    data: result,
  });
});

const getSingleGear = catchAsync(async (req: Request, res: Response) => {
  const gearId = req.params.id as string;

  if (!gearId) {
    throw createError("Gear Id is required", httpStatus.BAD_REQUEST, {
      field: "id",
      message: "Gear Id is required",
    });
  }

  const result = await gearService.getSingleGearFromDB(gearId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear Item Retrieved successfully",
    data: result,
  });
});

const createGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.id;

  if (!providerId) {
    throw createError(
      "Provider information not found in request",
      httpStatus.UNAUTHORIZED
    );
  }

  const result = await gearService.createGearIntoDB(req.body, providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Gear item created successfully",
    data: result,
  });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.id;
  const gearId = req.params.id as string;

  if (!providerId) {
    throw createError(
      "Provider information not found in request",
      httpStatus.UNAUTHORIZED
    );
  }

  if (!gearId) {
    throw createError("Gear Id is required", httpStatus.BAD_REQUEST, {
      field: "id",
      message: "Gear Id is required",
    });
  }

  const result = await gearService.updateGearIntoDB(
    gearId,
    req.body,
    providerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear item updated successfully",
    data: result,
  });
});

const deleteGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user?.id;
  const gearId = req.params.id as string;

  if (!providerId) {
    throw createError(
      "Provider information not found in request",
      httpStatus.UNAUTHORIZED
    );
  }

  if (!gearId) {
    throw createError("Gear Id is required", httpStatus.BAD_REQUEST, {
      field: "id",
      message: "Gear Id is required",
    });
  }

  const result = await gearService.deleteGearFromDB(gearId, providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear item deleted successfully",
    data: result,
  });
});

export const gearController = {
  getAllGear,
  getSingleGear,
  createGear,
  updateGear,
  deleteGear,
};