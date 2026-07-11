import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewValidation } from "./reviews.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { reviewController } from "./reviews.controller";

const router = Router();

router.post("/",auth(Role.CUSTOMER),validateRequest(reviewValidation.createReviewSchema),reviewController.createReview)

export const reviewsRouter = router;