import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for samples of today or patient Yolanda...");

  // Search by name or date
  const samples = await prisma.sample.findMany({
    include: {
      patient: true,
      orders: {
        include: {
          tests: true
        }
      }
    }
  });

  console.log("All samples in SQLite database:");
  console.log(JSON.stringify(samples, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
