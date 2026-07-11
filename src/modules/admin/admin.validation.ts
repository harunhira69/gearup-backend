import { z } from "zod";

const updateUserSchema = z.object({
  body: z
    .object({
      status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
      role: z.enum(["CUSTOMER", "PROVIDER"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
      path: ["body"],
    }),
});

export const adminValidation = {
  updateUserSchema,
};