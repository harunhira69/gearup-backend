import httpStatus from "http-status";
import { RentalStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { createError } from "../../utils/createError";

const getProviderOrdersFromDB = async (providerId: string) => {
  const orders = await prisma.rentalOrder.findMany({
    where: {
      items: {
        some: {
          gearItem: {
            providerId,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
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
      items: {
        where: {
          gearItem: {
            providerId,
          },
        },
        include: {
          gearItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return orders;
};

const updateProviderOrderStatusIntoDB = async (
  rentalOrderId: string,
  providerId: string,
  status: RentalStatus
) => {
  const result = await prisma.$transaction(async (tx) => {
    const rentalOrder = await tx.rentalOrder.findFirst({
      where: {
        id: rentalOrderId,
        items: {
          some: {
            gearItem: {
              providerId,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            gearItem: {
              providerId,
            },
          },
          include: {
            gearItem: true,
          },
        },
      },
    });

    if (!rentalOrder) {
      throw createError("Rental order not found", httpStatus.NOT_FOUND, {
        field: "id",
        value: rentalOrderId,
      });
    }

    const allowedTransitions: Partial<Record<RentalStatus, RentalStatus[]>> = {
      PLACED: ["CONFIRMED"],
      PAID: ["PICKED_UP"],
      PICKED_UP: ["RETURNED"],
    };

    const allowedNextStatuses = allowedTransitions[rentalOrder.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      throw createError(
        `Cannot update rental order status from ${rentalOrder.status} to ${status}`,
        httpStatus.BAD_REQUEST,
        {
          currentStatus: rentalOrder.status,
          requestedStatus: status,
          allowedNextStatuses,
        }
      );
    }

    if (status === "RETURNED") {
      for (const item of rentalOrder.items) {
        await tx.gearItem.update({
          where: {
            id: item.gearItemId,
          },
          data: {
            availableQuantity: {
              increment: item.quantity,
            },
            isAvailable: true,
          },
        });
      }
    }

    const updatedOrder = await tx.rentalOrder.update({
      where: {
        id: rentalOrderId,
      },
      data: {
        status,
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
        items: {
          where: {
            gearItem: {
              providerId,
            },
          },
          include: {
            gearItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return updatedOrder;
  });

  return result;
};

const getProviderDashboardFromDB = async (providerId: string) => {
  const [
    totalGear,
    availableGear,
    rentedGear,
    rentalItems,
  ] = await prisma.$transaction([
    prisma.gearItem.count({
      where: {
        providerId,
      },
    }),

    prisma.gearItem.count({
      where: {
        providerId,
        isAvailable: true,
      },
    }),

    prisma.rentalOrderItem.count({
      where: {
        gearItem: {
          providerId,
        },
        rentalOrder: {
          status: {
            in: ["CONFIRMED", "PAID", "PICKED_UP"],
          },
        },
      },
    }),

    prisma.rentalOrderItem.findMany({
      where: {
        gearItem: {
          providerId,
        },
        rentalOrder: {
          status: "RETURNED",
        },
      },
      select: {
        subtotal: true,
      },
    }),
  ]);

  const totalRevenue = rentalItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  return {
    totalGear,
    availableGear,
    activeRentals: rentedGear,
    completedRentals: rentalItems.length,
    totalRevenue,
  };
};

export const providerService = {
  getProviderOrdersFromDB,
  updateProviderOrderStatusIntoDB,
  getProviderDashboardFromDB
};