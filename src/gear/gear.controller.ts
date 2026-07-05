import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";

const createCategory = catchAsync(async(req:Request,res:Response)=>{
const result = await 
})

const getAllgear = catchAsync(async(req:Request,res:Response)=>{

})


export const gearController = {
    getAllgear,
    createCategory

}