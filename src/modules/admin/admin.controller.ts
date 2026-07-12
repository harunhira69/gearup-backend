import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResonse";
import httpStatus from "http-status"
import { createError } from "../../utils/createError";
const getAllUsers = catchAsync(async(req:Request,res:Response)=>{
    const result  = await adminService.getAllUsersFromDB();

    sendResponse(res,{
success:true,
statusCode:httpStatus.OK,
message:"Users retrieved successfully",
data:result
    })

})

const updateUser = catchAsync(async(req:Request,res:Response)=>{
 const adminId = req.user?.id;
  const userId = req.params.id;


if (!adminId) {
    throw createError("Admin information not found", httpStatus.UNAUTHORIZED);
  }

  const result = await adminService.updateUserIntoDB(
    userId as string,
    adminId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User updated successfully",
    data: result,
  });

})

const getAllGear = catchAsync(async(req:Request,res:Response)=>{
  const result = await adminService.getAllGearFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear items retrieved successfully",
    data: result,
  });

})

const getAllRentals = catchAsync(async(req:Request,res:Response)=>{
 const result = await adminService.getAllRentalsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental orders retrieved successfully",
    data: result,
  });
})


export const adminController  = {
    getAllUsers,
    updateUser,
    getAllGear,
    getAllRentals
}


