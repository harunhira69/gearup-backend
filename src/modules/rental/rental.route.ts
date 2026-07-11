import { Router } from "express";


import { rentalController } from "./rental.controller";
import { Role } from "../../../generated/prisma/enums";
import { validateCreateRental } from "./validateRental";
import { auth } from "../../middleware/auth";

const route = Router();

route.post(
  "/",
  auth(Role.CUSTOMER),
  validateCreateRental,
  rentalController.createRental
);



route.get("/", auth(Role.CUSTOMER), rentalController.getMyRentals);

route.get("/:id", auth(Role.CUSTOMER), rentalController.getSingleRental);

export const rentalRouter = route;