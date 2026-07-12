import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { adminValidation } from "./admin.validation";

const route = Router();

route.get(
  "/dashboard",
  auth(Role.ADMIN),
  adminController.getDashboard
);

route.get(
  "/users",
  auth(Role.ADMIN),
  adminController.getAllUsers
);

route.patch(
  "/users/:id",
  auth(Role.ADMIN),
  validateRequest(adminValidation.updateUserSchema),
  adminController.updateUser
);

route.get(
  "/gear",
  auth(Role.ADMIN),
  adminController.getAllGear
);

route.get(
  "/rentals",
  auth(Role.ADMIN),
  adminController.getAllRentals
);

export const adminRouter = route;