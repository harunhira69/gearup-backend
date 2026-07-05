import { prisma } from "../lib/prisma";
import { CreateCategoryPayload } from "./category.interface";

const createCategoryDB = async (payload: CreateCategoryPayload) => {
  const category = await prisma.category.create({
    data: payload,
  });

  return category;
};

const getAllCategoriesDB = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
  });

  return categories;
};

export const categoryService = {
  createCategoryDB,
  getAllCategoriesDB,
};