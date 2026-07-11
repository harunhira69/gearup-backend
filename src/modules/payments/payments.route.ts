import { Router } from "express";
import { paymentController } from "./payments.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";


const router = Router()

router.post("/create",auth(Role.CUSTOMER),paymentController.createPayment)

export const paymentRouter = router;