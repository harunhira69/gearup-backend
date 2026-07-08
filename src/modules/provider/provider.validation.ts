import { z } from "zod";

const updateProviderOrderStatusSchema = z.object({
  body: z.object({
    status: z.string().refine(
      (value) => ["CONFIRMED", "PICKED_UP", "RETURNED"].includes(value),
      {
        message: "Status must be CONFIRMED, PICKED_UP, or RETURNED",
      }
    ),
  }),
});

export const providerValidation = {
  updateProviderOrderStatusSchema,
};