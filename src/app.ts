import express, { Application, Request, Response } from "express"
import config from "./config";
import cors from "cors"
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";
import { router } from "./user/user.route";

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


export default app