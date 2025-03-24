const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global;

// This will store the Prisma Client globally to avoid multiple instances in development
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function main() {
  console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
