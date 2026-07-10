import { z } from "zod";

const updateProviderOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["CONFIRMED", "PICKED_UP", "RETURNED"],
      {
        message: "Status must be CONFIRMED, PICKED_UP, or RETURNED",
      }
    ),
  }),
});

export const providerValidation = {
  updateProviderOrderStatusSchema,
};