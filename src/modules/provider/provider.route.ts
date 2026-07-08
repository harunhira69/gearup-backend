import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { gearController } from "../gear/gear.controller";
import { gearValidation } from "../gear/gear.validation";
import { auth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { providerController } from "./provider.controller";
import { providerValidation } from "./provider.validation";

const route = Router();

route.post(
  "/gear",
  auth(Role.PROVIDER),
  validateRequest(gearValidation.createGearSchema),
  gearController.createGear
);

route.put(
  "/gear/:id",
  auth(Role.PROVIDER),
  validateRequest(gearValidation.updateGearSchema),
  gearController.updateGear
);

route.delete("/gear/:id", auth(Role.PROVIDER), gearController.deleteGear);

route.get("/orders", auth(Role.PROVIDER), providerController.getProviderOrders);

route.patch(
  "/orders/:id",
  auth(Role.PROVIDER),
  validateRequest(providerValidation.updateProviderOrderStatusSchema),
  providerController.updateProviderOrderStatus
);

export const providerRouter = route;