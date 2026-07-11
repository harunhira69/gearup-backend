import { z } from "zod";

const createReviewSchema = z.object({
  body: z.object({
    rentalOrderId: z.string().uuid("Rental order ID must be a valid UUID"),
    gearItemId: z.string().uuid("Gear item ID must be a valid UUID"),
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be more than 5"),
    comment: z
      .string()
      .min(5, "Comment must be at least 5 characters")
      .max(500, "Comment cannot be more than 500 characters"),
  }),
});

export const reviewValidation = {
  createReviewSchema,
};