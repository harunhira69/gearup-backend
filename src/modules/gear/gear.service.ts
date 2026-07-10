import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { createError, createValidationError } from "../../utils/createError";
import {
  CreateGearPayload,
  GearFilterQuery,
  UpdateGearPayload,
} from "./gear.interface";
import httpStatus from "http-status";

const getAllGearFromDB = async (query: GearFilterQuery) => {
  const { category, price, brand } = query;

  const andConditions: Prisma.GearItemWhereInput[] = [];

  if (category) {
    andConditions.push({
      OR: [
        {
          categoryId: category,
        },
        {
          category: {
            name: {
              contains: category,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (brand) {
    andConditions.push({
      brand: {
        contains: brand,
        mode: "insensitive",
      },
    });
  }

  if (price) {
    const maxPrice = Number(price);

    if (Number.isNaN(maxPrice)) {
      throw createValidationError([
        {
          field: "price",
          message: "Price must be a valid number",
        },
      ]);
    }

    andConditions.push({
      pricePerDay: {
        lte: maxPrice,
      },
    });
  }

  const whereCondition: Prisma.GearItemWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const gear = await prisma.gearItem.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  return gear;
};

const getSingleGearFromDB = async (gearId: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: {
      id: gearId,
    },
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!gear) {
    throw createError("Gear Item Not Found", httpStatus.NOT_FOUND, {
      field: "id",
      value: gearId,
    });
  }

  return gear;
};

const createGearIntoDB = async (
  payload: CreateGearPayload,
  providerId: string
) => {
  const result = await prisma.$transaction(async (tx) => {
    const provider = await tx.user.findUnique({
      where: {
        id: providerId,
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!provider) {
      throw createError("Provider not found", httpStatus.NOT_FOUND);
    }

    if (provider.role !== "PROVIDER") {
      throw createError(
        "Only providers can create gear items",
        httpStatus.FORBIDDEN
      );
    }

    if (provider.status === "SUSPENDED") {
      throw createError(
        "Suspended provider cannot create gear items",
        httpStatus.FORBIDDEN
      );
    }

    const category = await tx.category.findUnique({
      where: {
        id: payload.categoryId,
      },
    });

    if (!category) {
      throw createError("Category not found", httpStatus.NOT_FOUND, {
        field: "categoryId",
        value: payload.categoryId,
      });
    }

    if (payload.availableQuantity > payload.stock) {
      throw createValidationError([
        {
          field: "availableQuantity",
          message: "Available quantity cannot be greater than stock",
        },
      ]);
    }


    const normalizedName = payload.name.trim();
    const normalizedBrand = payload.brand.trim();

  const existingGear = await tx.gearItem.findFirst({
    where:{
      providerId,
      categoryId:payload.categoryId,
      name:{
        equals:normalizedName,
        mode:"insensitive"
      },
      brand:{
        equals:normalizedBrand,
        mode:"insensitive"
      },
    }
  });

  if(existingGear){
    throw createError(
      "Gear item already exists for this provider",
      httpStatus.CONFLICT,
       {
          fields: ["name", "brand", "categoryId"],
          existingGearId: existingGear.id,
        }
    );
  }

    const gear = await tx.gearItem.create({
      data: {
        name: normalizedName,
        description: payload.description,
        brand: normalizedBrand,
        pricePerDay: payload.pricePerDay,
        stock: payload.stock,
        availableQuantity: payload.availableQuantity,
        imageUrl: payload.imageUrl,
        ...(payload.specifications !== undefined && {
          specifications: payload.specifications as Prisma.InputJsonValue,
        }),
        isAvailable: true,
        categoryId: payload.categoryId,
        providerId,
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return gear;
  });

  return result;
};

const updateGearIntoDB = async (
  gearId: string,
  payload: UpdateGearPayload,
  providerId: string
) => {
  const result = await prisma.$transaction(async (tx) => {
    const existingGear = await tx.gearItem.findUnique({
      where: {
        id: gearId,
      },
    });

    if (!existingGear) {
      throw createError("Gear item not found", httpStatus.NOT_FOUND, {
        field: "id",
        value: gearId,
      });
    }

    if (existingGear.providerId !== providerId) {
      throw createError(
        "You can only update your own gear items",
        httpStatus.FORBIDDEN
      );
    }

    if (payload.categoryId) {
      const category = await tx.category.findUnique({
        where: {
          id: payload.categoryId,
        },
      });

      if (!category) {
        throw createError("Category not found", httpStatus.NOT_FOUND, {
          field: "categoryId",
          value: payload.categoryId,
        });
      }
    }

    const finalStock = payload.stock ?? existingGear.stock;
    const finalAvailableQuantity =
      payload.availableQuantity ?? existingGear.availableQuantity;

    if (finalAvailableQuantity > finalStock) {
      throw createValidationError([
        {
          field: "availableQuantity",
          message: "Available quantity cannot be greater than stock",
        },
      ]);
    }

    const updatedGear = await tx.gearItem.update({
      where: {
        id: gearId,
      },
      data: {
        name: payload.name,
        description: payload.description,
        brand: payload.brand,
        pricePerDay: payload.pricePerDay,
        stock: payload.stock,
        availableQuantity: payload.availableQuantity,
        imageUrl: payload.imageUrl,
        isAvailable: payload.isAvailable,
        ...(payload.specifications !== undefined && {
          specifications: payload.specifications as Prisma.InputJsonValue,
        }),
        ...(payload.categoryId && {
          categoryId: payload.categoryId,
        }),
      },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return updatedGear;
  });

  return result;
};

const deleteGearFromDB = async (gearId: string, providerId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const existingGear = await tx.gearItem.findUnique({
      where: {
        id: gearId,
      },
    });

    if (!existingGear) {
      throw createError("Gear item not found", httpStatus.NOT_FOUND, {
        field: "id",
        value: gearId,
      });
    }

    if (existingGear.providerId !== providerId) {
      throw createError(
        "You can only delete your own gear items",
        httpStatus.FORBIDDEN
      );
    }

    const rentalItemCount = await tx.rentalOrderItem.count({
      where: {
        gearItemId: gearId,
      },
    });

    if (rentalItemCount > 0) {
      await tx.gearItem.update({
        where: {
          id: gearId,
        },
        data: {
          isAvailable: false,
          availableQuantity: 0,
        },
      });

      return {
        deleted: true,
        softDeleted: true,
        gearId,
        message:
          "Gear item has rental history, so it was marked as unavailable instead of permanent delete",
      };
    }

    await tx.gearItem.delete({
      where: {
        id: gearId,
      },
    });

    return {
      deleted: true,
      softDeleted: false,
      gearId,
      message: "Gear item permanently deleted",
    };
  });

  return result;
};

export const gearService = {
  getAllGearFromDB,
  getSingleGearFromDB,
  createGearIntoDB,
  updateGearIntoDB,
  deleteGearFromDB,
};