import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({});

async function main() {
  console.log("Seeding database...");

  // Create Patient using upsert
  const patient = await prisma.patient.upsert({
    where: { uniqueId: "12345678" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Pérez",
      uniqueId: "12345678",
      gender: "Male"
    }
  });

  // Create Sample using upsert
  const sample = await prisma.sample.upsert({
    where: { barcode: "M-10001" },
    update: {},
    create: {
      patientId: patient.id,
      sampleType: "Cultivo Microbiológico",
      barcode: "M-10001"
    }
  });

  // Create Order if it doesn't exist
  const existingOrder = await prisma.order.findFirst({
    where: { sampleId: sample.id }
  });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        sampleId: sample.id,
        status: "PENDING"
      }
    });
  }

  // Create Workcard if it doesn't exist
  const existingWorkcard = await prisma.workcard.findFirst({
    where: { sampleId: sample.id }
  });
  if (!existingWorkcard) {
    await prisma.workcard.create({
      data: {
        sampleId: sample.id,
        mediaType: 'Agar Sangre',
        readDay1: 'Sin crecimiento',
        readDay2: ''
      }
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
