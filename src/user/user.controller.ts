import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../utils/sendResonse";
import httpStatus from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    try {
        const user = await userService.registerUserDB(payload);
        sendResponse(res, {
            success: true,
            message: "Customer created successfully",
            statusCode: httpStatus.CREATED,
            data: user,
        });
    } catch (error) {
        const err = error as Error & { statusCode?: number };
        sendResponse(res, {
            success: false,
            message: err.message || "Failed to create user",
            statusCode: err.statusCode ?? httpStatus.INTERNAL_SERVER_ERROR,
            data: null,
        });
    }
});

const userProfile = catchAsync(async(req:Request,res:Response)=>{
  const {id} = req.params
    const user = await userService.userProfileIntoDb(id as string);

    sendResponse(res,{
        success:true,
        message:"Get User",
        statusCode:httpStatus.OK,
        data:user
    })
})

export const userController = {
    registerUser,
    userProfile
};