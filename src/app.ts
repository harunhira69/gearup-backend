import express, { Application, NextFunction, Request, Response } from "express"
import config from "./config";
import cors from "cors"
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";

import { authRouter } from "./auth/auth.route";

import { notFound } from "./middleware/notFound";
import httpStatus from "http-status";
import { STATUS_CODES } from "node:http";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { router } from "./modules/user/user.route";
import { gearRoute } from "./modules/gear/gear.route";
import { categoryRouter } from "./modules/category/category.route";
import { rentalRouter } from "./modules/rental/rental.route";
import { providerRouter } from "./modules/provider/provider.route";
import { paymentRouter } from "./modules/payments/payments.route";

const app:Application = express();

app.use(cors({
    origin:config.app_url,
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())



app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "GearUp API is running successfully",
  });
});


app.use("/api/auth",router)
app.use("/api/auth",authRouter)



app.use("/api/gear", gearRoute);
app.use("/api/categories",categoryRouter)
app.use("/api/rentals", rentalRouter);
app.use("/api/provider", providerRouter);

app.use("/api/payments",paymentRouter)


app.use(notFound)
app.use(globalErrorHandler)


export default app