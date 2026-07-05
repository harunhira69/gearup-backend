import { Router } from "express";
import { userController } from "./user.controller";

const route = Router()

route.post("/register",userController.registerUser)

export const router = route
