import { prisma } from "../../lib/prisma";


const getAllCategoriesDB = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return categories;
};

export const categoryService = {
  getAllCategoriesDB,
};