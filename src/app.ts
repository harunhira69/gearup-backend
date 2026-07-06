import express, { Application, NextFunction, Request, Response } from "express"
import config from "./config";
import cors from "cors"
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { router } from "./user/user.route";
import { authRouter } from "./auth/auth.route";
import { categoryRouter } from "./category/category.route";
import { gearRoute} from "./gear/gear.route";
import { notFound } from "./middleware/notFound";
import httpStatus from "http-status";
import { STATUS_CODES } from "node:http";
import { globalErrorHandler } from "./middleware/globalErrorHandler";

const app:Application = express();

app.use(cors({
    origin:config.app_url,
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())



app.get("/",async(req:Request,res:Response)=>{
    const user = await prisma.user.findMany()
    console.log(user)
res.send("Hell0 World")
})


app.use("/api/auth",router)

app.use("/api/auth",authRouter)

app.use("/api/gear", gearRoute);

app.use("/api/categories",categoryRouter)


app.use(notFound)

app.use(globalErrorHandler)


export default app