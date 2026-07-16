import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = Number(process.env.PORT || 5000);

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    if (process.env.VERCEL !== "1") {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Error starting the server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  main();
}

export default app;