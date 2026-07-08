import { z } from "zod";

const createGearSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Gear name is required"),
      description: z.string().min(1, "Description is required"),
      brand: z.string().min(1, "Brand is required"),
      pricePerDay: z
        .number()
        .positive("Price per day must be a positive number"),
      stock: z
        .number()
        .int("Stock must be an integer")
        .nonnegative("Stock must be a non-negative integer"),
      availableQuantity: z
        .number()
        .int("Available quantity must be an integer")
        .nonnegative("Available quantity must be a non-negative integer"),
      imageUrl: z.string().url("Image URL must be valid").optional(),
      specifications: z.record(z.string(), z.unknown()).optional(),
      categoryId: z.string().min(1, "Category ID is required"),
    })
    .refine((data) => data.availableQuantity <= data.stock, {
      message: "Available quantity cannot be greater than stock",
      path: ["availableQuantity"],
    }),
});

const updateGearSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Gear name cannot be empty").optional(),
      description: z.string().min(1, "Description cannot be empty").optional(),
      brand: z.string().min(1, "Brand cannot be empty").optional(),
      pricePerDay: z
        .number()
        .positive("Price per day must be a positive number")
        .optional(),
      stock: z
        .number()
        .int("Stock must be an integer")
        .nonnegative("Stock must be a non-negative integer")
        .optional(),
      availableQuantity: z
        .number()
        .int("Available quantity must be an integer")
        .nonnegative("Available quantity must be a non-negative integer")
        .optional(),
      imageUrl: z.string().url("Image URL must be valid").optional(),
      specifications: z.record(z.string(), z.unknown()).optional(),
      isAvailable: z.boolean().optional(),
      categoryId: z.string().min(1, "Category ID cannot be empty").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required for update",
      path: ["body"],
    })
    .refine(
      (data) => {
        if (
          data.stock !== undefined &&
          data.availableQuantity !== undefined &&
          data.availableQuantity > data.stock
        ) {
          return false;
        }

        return true;
      },
      {
        message: "Available quantity cannot be greater than stock",
        path: ["availableQuantity"],
      }
    ),
});

export const gearValidation = {
  createGearSchema,
  updateGearSchema,
};