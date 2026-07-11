import { RentalStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../utils/createError";
import { CreateReviewPayload } from "./reviews.interface";
import httpStatus from "http-status"

const createReviewIntoDB = async (
  payload: CreateReviewPayload,
  customerId: string
) => {
  const result = await prisma.$transaction(async (tx) => {
    const rentalOrder = await tx.rentalOrder.findFirst({
      where: {
        id: payload.rentalOrderId,
        customerId,
      },
      include: {
        items: true,
      },
    });

    if (!rentalOrder) {
      throw createError("Rental order not found", httpStatus.NOT_FOUND, {
        field: "rentalOrderId",
        value: payload.rentalOrderId,
      });
    }

    if (rentalOrder.status !== RentalStatus.RETURNED) {
      throw createError(
        "You can review only after the rental order is returned",
        httpStatus.BAD_REQUEST,
        {
          currentStatus: rentalOrder.status,
          requiredStatus: RentalStatus.RETURNED,
        }
      );
    }

    const rentedGearItem = rentalOrder.items.find(
      (item) => item.gearItemId === payload.gearItemId
    );

    if (!rentedGearItem) {
      throw createError(
        "This gear item does not belong to this rental order",
        httpStatus.BAD_REQUEST,
        {
          rentalOrderId: payload.rentalOrderId,
          gearItemId: payload.gearItemId,
        }
      );
    }

    const existingReview = await tx.review.findFirst({
      where: {
        customerId,
        rentalOrderId: payload.rentalOrderId,
        gearItemId: payload.gearItemId,
      },
    });

    if (existingReview) {
      throw createError(
        "You have already reviewed this gear item for this rental order",
        httpStatus.CONFLICT,
        {
          reviewId: existingReview.id,
          rentalOrderId: payload.rentalOrderId,
          gearItemId: payload.gearItemId,
        }
      );
    }

    const review = await tx.review.create({
      data: {
        customerId,
        rentalOrderId: payload.rentalOrderId,
        gearItemId: payload.gearItemId,
        rating: payload.rating,
        comment: payload.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        rentalOrder: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            startDate: true,
            endDate: true,
          },
        },
        gearItem: {
          include: {
            category: true,
          },
        },
      },
    });

    return review;
  });

  return result;
};

export const reviewService = {
  createReviewIntoDB,
};