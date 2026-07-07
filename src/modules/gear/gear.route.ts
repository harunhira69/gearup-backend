import { Router } from "express";
import { gearController } from "./gear.controller";

const router = Router();
router.get("/",gearController.getAllGear)
router.get("/:id",gearController.getSingleGear)
export const gearRoute = router;