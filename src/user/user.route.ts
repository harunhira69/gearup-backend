import { Router } from "express";
import { userController } from "./user.controller";

const route = Router()

route.post("/register",userController.registerUser)
route.get("/:id",userController.userProfile)
export const router = route
