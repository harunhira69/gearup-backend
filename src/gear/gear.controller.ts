import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { gearService } from "./gear.service";
import { sendResponse } from "../utils/sendResonse";
import httpStatus from "http-status";
const getAllGear = catchAsync(async(req:Request,res:Response)=>{
const query = req.query

const result = await gearService.getAllGearFromDB(query);

sendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"Gear Item Retrieved successfully",
    data:result
})

})

const getSingleGear = catchAsync(async()=>{

})

export const gearController = {
    getAllGear,
    getSingleGear

}