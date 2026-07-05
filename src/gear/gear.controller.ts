import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";

const getAllgear = catchAsync(async(req:Request,res:Response)=>{

})


export const gearController = {
    getAllgear,
    
}