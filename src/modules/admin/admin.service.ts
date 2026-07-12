import { prisma } from "../../lib/prisma";
import { UserStatus } from "../../../generated/prisma/enums";
import { createError } from "../../utils/createError";
import httpStatus from "http-status";

const getDashboardFromDB = async () => {
  const [
    totalUsers,
    totalProviders,
    totalCustomers,
    totalGear,
    totalRentals,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        role: "PROVIDER",
      },
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    }),
    prisma.gearItem.count(),
    prisma.rentalOrder.count(),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "PAID",
      },
    }),
  ]);

  return {
    totalUsers,
    totalProviders,
    totalCustomers,
    totalGear,
    totalRentals,
    totalRevenue: totalRevenue._sum.amount ?? 0,
  };
};

const getAllUsersFromDB = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateUserIntoDB = async (
  userId: string,
  payload: {
    status: UserStatus;
  }
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw createError("User not found", httpStatus.NOT_FOUND);
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: payload.status,
    },
  });
};

const getAllGearFromDB = async () => {
  return prisma.gearItem.findMany({
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getAllRentalsFromDB = async () => {
  return prisma.rentalOrder.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: true,
      items: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              brand: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const adminService = {
  getDashboardFromDB,
  getAllUsersFromDB,
  updateUserIntoDB,
  getAllGearFromDB,
  getAllRentalsFromDB,
};