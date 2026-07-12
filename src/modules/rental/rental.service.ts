import httpStatus from "http-status";

import { CreateRentalPayload } from "./rental.interface";
import { createError, createValidationError } from "../../utils/createError";
import { prisma } from "../../lib/prisma";

const calculateRentalDays = (startDate: Date, endDate: Date) => {
  const oneDay = 1000 * 60 * 60 * 24;
  const difference = endDate.getTime() - startDate.getTime();

  return Math.ceil(difference / oneDay);
};

const createRentalIntoDB = async (
  payload: CreateRentalPayload,
  customerId: string
) => {
  const { startDate, endDate, items } = payload;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createValidationError([
      {
        field: "date",
        message: "Start date and end date must be valid dates",
      },
    ]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw createValidationError([
      {
        field: "startDate",
        message: "Start date cannot be in the past",
      },
    ]);
  }

  if (end <= start) {
    throw createValidationError([
      {
        field: "endDate",
        message: "End date must be after start date",
      },
    ]);
  }

  const rentalDays = calculateRentalDays(start, end);

  const result = await prisma.$transaction(async (tx) => {
    const customer = await tx.user.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!customer) {
      throw createError("Customer not found", httpStatus.NOT_FOUND);
    }

    if (customer.role !== "CUSTOMER") {
      throw createError(
        "Only customers can place rental orders",
        httpStatus.FORBIDDEN
      );
    }

    if (customer.status === "SUSPENDED") {
      throw createError(
        "Suspended customer cannot place rental orders",
        httpStatus.FORBIDDEN
      );
    }



  const itemQuantityMap = new Map<string, number>();

for (const item of items) {
  itemQuantityMap.set(
    item.gearItemId,
    (itemQuantityMap.get(item.gearItemId) || 0) + item.quantity
  );
}

const requestedItems = Array.from(itemQuantityMap.entries()).map(
  ([gearItemId, quantity]) => ({
    gearItemId,
    quantity,
  })
);

const gearIds = requestedItems.map((item) => item.gearItemId);

const gearItems = await tx.gearItem.findMany({
  where: {
    id: {
      in: gearIds,
    },
  },
});

const gearMap = new Map(gearItems.map((gear) => [gear.id, gear]));

for (const requestedItem of requestedItems) {
  const gear = gearMap.get(requestedItem.gearItemId);

  if (!gear) {
    throw createError("Gear item not found", httpStatus.NOT_FOUND, {
      field: "gearItemId",
      value: requestedItem.gearItemId,
    });
  }

  // Customer cannot rent own gear
  if (gear.providerId === customerId) {
    throw createError(
      "You cannot rent your own gear",
      httpStatus.FORBIDDEN
    );
  }

  if (!gear.isAvailable) {
    throw createError(
      "Gear item is not available",
      httpStatus.BAD_REQUEST,
      {
        field: "gearItemId",
        value: requestedItem.gearItemId,
      }
    );
  }

  if (gear.availableQuantity < requestedItem.quantity) {
    throw createError(
      "Requested quantity is not available",
      httpStatus.BAD_REQUEST,
      {
        gearItemId: requestedItem.gearItemId,
        requestedQuantity: requestedItem.quantity,
        availableQuantity: gear.availableQuantity,
      }
    );
  }

  // Rental date overlap check
  const overlappingRental = await tx.rentalOrderItem.findFirst({
    where: {
      gearItemId: requestedItem.gearItemId,
      rentalOrder: {
        status: {
          in: [
            "PLACED",
            "CONFIRMED",
            "PAID",
            "PICKED_UP",
          ],
        },
        AND: [
          {
            startDate: {
              lte: end,
            },
          },
          {
            endDate: {
              gte: start,
            },
          },
        ],
      },
    },
    include: {
      rentalOrder: true,
    },
  });

  if (overlappingRental) {
    throw createError(
      "Gear item is already booked for the selected dates",
      httpStatus.BAD_REQUEST,
      {
        gearItemId: requestedItem.gearItemId,
        startDate,
        endDate,
      }
    );
  }
}

   let totalAmount = 0;

const rentalOrderItemsData = requestedItems.map((item) => {
  const gear = gearMap.get(item.gearItemId);

  if (!gear) {
    throw createError("Gear item not found", httpStatus.NOT_FOUND);
  }

  const subtotal = gear.pricePerDay * item.quantity * rentalDays;

  totalAmount += subtotal;

  return {
    gearItemId: item.gearItemId,
    quantity: item.quantity,
    pricePerDay: gear.pricePerDay,
    subtotal,
  };
});

// Reserve stock
for (const item of requestedItems) {
  const updateResult = await tx.gearItem.updateMany({
    where: {
      id: item.gearItemId,
      isAvailable: true,
      availableQuantity: {
        gte: item.quantity,
      },
    },
    data: {
      availableQuantity: {
        decrement: item.quantity,
      },
    },
  });

  if (updateResult.count !== 1) {
    throw createError(
      "Failed to reserve gear item due to insufficient availability",
      httpStatus.BAD_REQUEST,
      {
        gearItemId: item.gearItemId,
        quantity: item.quantity,
      }
    );
  }
}

// Create Rental Order
const rentalOrder = await tx.rentalOrder.create({
  data: {
    customerId,
    startDate: start,
    endDate: end,
    totalAmount,

    items: {
      create: rentalOrderItemsData,
    },
  },

  include: {
    customer: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },

    items: {
      include: {
        gearItem: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            brand: true,
            pricePerDay: true,
            availableQuantity: true,

            category: {
              select: {
                id: true,
                name: true,
              },
            },

            provider: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    },
  },
});

return rentalOrder;
  });

  return result;
};




const getMyRentalsFromDB = async (customerId: string) => {
  return await prisma.rentalOrder.findMany({
    where: {
      customerId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      items: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
             imageUrl: true,
              brand: true,
              pricePerDay: true,
              availableQuantity: true,
              isAvailable: true,

              category: {
                select: {
                  id: true,
                  name: true,
                },
              },

              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          provider: true,
          paidAt: true,
        },
      },
    },
  });
};

const getSingleRentalFromDB = async (
  rentalId: string,
  customerId: string
) => {
  const rental = await prisma.rentalOrder.findFirst({
    where: {
      id: rentalId,
      customerId,
    },

    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      items: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
             imageUrl: true,
              brand: true,
              description: true,
              pricePerDay: true,
              availableQuantity: true,
              isAvailable: true,

              category: {
                select: {
                  id: true,
                  name: true,
                },
              },

              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          provider: true,
          transactionId: true,
          paidAt: true,
        },
      },
    },
  });

  if (!rental) {
    throw createError("Rental order not found", httpStatus.NOT_FOUND, {
      field: "id",
      value: rentalId,
    });
  }

  return rental;
};
export const rentalService = {
  createRentalIntoDB,
  getMyRentalsFromDB,
  getSingleRentalFromDB,
};