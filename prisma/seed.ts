import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { Role, UserStatus } from "../generated/prisma/enums";

const main = async () => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@gearup.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  const providerEmail = process.env.PROVIDER_EMAIL ?? "provider@gearup.com";
  const providerPassword = process.env.PROVIDER_PASSWORD ?? "provider123";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
  const hashedProviderPassword = await bcrypt.hash(providerPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: "GearUp Admin",
      password: hashedAdminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: "GearUp Admin",
      email: adminEmail,
      password: hashedAdminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: admin.id,
    },
    update: {},
    create: {
      userId: admin.id,
    },
  });

  const provider = await prisma.user.upsert({
    where: {
      email: providerEmail,
    },
    update: {
      name: "GearUp Demo Provider",
      password: hashedProviderPassword,
      role: Role.PROVIDER,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: "GearUp Demo Provider",
      email: providerEmail,
      password: hashedProviderPassword,
      role: Role.PROVIDER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.profile.upsert({
    where: {
      userId: provider.id,
    },
    update: {},
    create: {
      userId: provider.id,
    },
  });

  const camping = await prisma.category.upsert({
    where: {
      name: "Camping",
    },
    update: {},
    create: {
      name: "Camping",
      description: "Tents, sleeping bags, backpacks, and outdoor camping gear.",
    },
  });

  const cycling = await prisma.category.upsert({
    where: {
      name: "Cycling",
    },
    update: {},
    create: {
      name: "Cycling",
      description: "Bicycles, helmets, and cycling accessories.",
    },
  });

  const fitness = await prisma.category.upsert({
    where: {
      name: "Fitness",
    },
    update: {},
    create: {
      name: "Fitness",
      description: "Gym, workout, and fitness training equipment.",
    },
  });

  const demoGearItems = [
    {
      name: "Camping Tent 4 Person",
      description:
        "Water-resistant family camping tent for outdoor trips and hiking adventures.",
      brand: "Coleman",
      pricePerDay: 350,
      stock: 12,
      availableQuantity: 10,
      imageUrl: "https://example.com/images/camping-tent.jpg",
      specifications: {
        capacity: "4 person",
        material: "Water-resistant polyester",
        setupTime: "10 minutes",
      },
      categoryId: camping.id,
    },
    {
      name: "Mountain Bike Pro X1",
      description:
        "A durable mountain bike suitable for trails, city rides, and adventure cycling.",
      brand: "Trek",
      pricePerDay: 450,
      stock: 8,
      availableQuantity: 8,
      imageUrl: "https://example.com/images/mountain-bike.jpg",
      specifications: {
        frame: "Aluminum",
        wheelSize: "29 inch",
        gear: "21 speed",
      },
      categoryId: cycling.id,
    },
    {
      name: "Adjustable Dumbbell Set",
      description:
        "Adjustable dumbbell set for strength training and home workouts.",
      brand: "Bowflex",
      pricePerDay: 250,
      stock: 15,
      availableQuantity: 12,
      imageUrl: "https://example.com/images/dumbbell-set.jpg",
      specifications: {
        weightRange: "5kg - 25kg",
        type: "Adjustable",
      },
      categoryId: fitness.id,
    },
  ];

  for (const item of demoGearItems) {
    const existingGear = await prisma.gearItem.findFirst({
      where: {
        name: item.name,
        providerId: provider.id,
      },
    });

    if (!existingGear) {
      await prisma.gearItem.create({
        data: {
          ...item,
          isAvailable: true,
          providerId: provider.id,
        },
      });
    }
  }

  console.log("Seed completed successfully");
  console.log("Admin credentials:");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log("Provider credentials:");
  console.log(`Email: ${providerEmail}`);
  console.log(`Password: ${providerPassword}`);
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });