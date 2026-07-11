import { z } from "zod";

const createPaymentSchema = z.object({
  body: z.object({
    rentalOrderId: z.string().uuid("Rental order ID must be a valid UUID"),
  }),
});

const confirmPaymentSchema = z.object({
  body: z
    .object({
      paymentId: z.string().uuid("Payment ID must be a valid UUID").optional(),
      sessionId: z.string().min(1, "Session ID is required").optional(),
    })
    .refine((data) => data.paymentId || data.sessionId, {
      message: "Either paymentId or sessionId is required",
      path: ["sessionId"],
    }),
});

export const paymentValidation = {
  createPaymentSchema,
  confirmPaymentSchema,
};