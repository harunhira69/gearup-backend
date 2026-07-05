import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../middleware/auth";

const route = Router()

route.post("/login",authController.loginUser)
route.get("/me",auth(),
    authController.getMe)

export const  authRouter = route;