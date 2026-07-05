import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../utils/sendResonse";
import httpStatus from "http-status"
const loginUser = catchAsync(async(req:Request,res:Response)=>{
const payload = req.body;

const {accessToken,refreshToken,user} = await authService.loginUserDB(payload);
    res.cookie("accessToken",accessToken,{
       httpOnly:true,
       secure:false,
       sameSite:"none",
       maxAge:1000*60*60*24      
    })

        res.cookie("refreshToken",refreshToken,{
       httpOnly:true,
       secure:false,
       sameSite:"none",
       maxAge:1000*60*60*24*7    
    })

    sendResponse(res,{
        success:true,
        statusCode:httpStatus.OK,
        message:"User logged in successfully",
        data:{user,accessToken,refreshToken}
    })

})

const refreshToken = catchAsync(async(req:Request,res:Response,next:NextFunction)=>{
  const refreshToken = req.cookies.refreshToken;
  const {accessToken} = await authService.refreshToken(refreshToken)

      res.cookie("accessToken",accessToken,{
       httpOnly:true,
       secure:false,
       sameSite:"none",
       maxAge:1000*60*60*24      
    })
  sendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"Token Refreshed Successfully",
    data:{
        accessToken
    }
  })
})

const getMe = catchAsync(async(req:Request,res:Response)=>{
 const userId = req.user?.id;
 if(!userId){
    throw new Error("User information not found in request");
    
 }

const user = await authService.getUserDB(userId);
sendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"Current authenticated user retrieved successfully",
    data:user
})

})

export const authController = {
    loginUser,
    refreshToken,
    getMe
}