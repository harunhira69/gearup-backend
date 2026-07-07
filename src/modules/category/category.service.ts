import { prisma } from "../../lib/prisma";


const getAllCategoriesDB = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

export const categoryService = {
  getAllCategoriesDB,
};