import { Request, Response } from "express";
import httpStatus from "http-status";

import { categoryService } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResonse";

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategoriesDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

export const categoryController = {
  getAllCategories,
};