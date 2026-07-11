import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { paymentController } from "./payments.controller";
import { paymentValidation } from "./payments.validation";

const route = Router();

route.post(
  "/create",
  auth(Role.CUSTOMER),
  validateRequest(paymentValidation.createPaymentSchema),
  paymentController.createCheckOutSession
);

route.post(
  "/confirm",
  auth(Role.CUSTOMER),
  validateRequest(paymentValidation.confirmPaymentSchema),
  paymentController.confirmPayment
);

route.get("/", auth(Role.CUSTOMER), paymentController.getMyPayments);

route.get("/:id", auth(Role.CUSTOMER), paymentController.getSinglePayment);

export const paymentRouter = route;