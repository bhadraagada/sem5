import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  // Create Jai Hind College
  const college = await prisma.college.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Jai Hind College",
      slug: "jai-hind-college",
      address: "A Road, Churchgate",
      city: "Mumbai",
      contactEmail: "info@jaihindcollege.edu.in",
      contactPhone: "+91-22-2266-1234",
    },
  });

  console.log("✅ Created college:", college);

  // Create default departments
  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics",
    "Mechanical Engineering",
    "Business Administration",
    "Arts & Humanities",
  ];

  for (const deptName of departments) {
    await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: {
        name: deptName,
        collegeId: 1,
      },
    });
  }

  console.log("✅ Created departments");

  // Create sample buildings and rooms
  const mainBuilding = await prisma.building.upsert({
    where: { id: "main-building" },
    update: {},
    create: {
      id: "main-building",
      name: "Main Building",
      floors: 5,
      collegeId: 1,
    },
  });

  const csBuilding = await prisma.building.upsert({
    where: { id: "cs-building" },
    update: {},
    create: {
      id: "cs-building",
      name: "Computer Science Building",
      floors: 3,
      collegeId: 1,
    },
  });

  // Create sample rooms
  const rooms = [
    {
      name: "Room 101",
      capacity: 60,
      type: "CLASSROOM",
      buildingId: mainBuilding.id,
    },
    {
      name: "Room 102",
      capacity: 40,
      type: "CLASSROOM",
      buildingId: mainBuilding.id,
    },
    { name: "CS Lab 1", capacity: 30, type: "LAB", buildingId: csBuilding.id },
    { name: "CS Lab 2", capacity: 30, type: "LAB", buildingId: csBuilding.id },
    {
      name: "Auditorium",
      capacity: 200,
      type: "AUDITORIUM",
      buildingId: mainBuilding.id,
    },
    {
      name: "Conference Room",
      capacity: 20,
      type: "CONFERENCE",
      buildingId: mainBuilding.id,
    },
  ];

  for (const room of rooms) {
    await prisma.room.create({
      data: room,
    });
  }

  console.log("✅ Created buildings and rooms");

  // Create sample resources
  const resources = [
    { name: "Projector", quantity: 25, notes: "Standard classroom projectors" },
    {
      name: "Microphone System",
      quantity: 10,
      notes: "Wireless microphone sets",
    },
    { name: "Laptop", quantity: 50, notes: "For student use" },
    { name: "Whiteboard", quantity: 30, notes: "Interactive whiteboards" },
  ];

  for (const resource of resources) {
    await prisma.resource.create({
      data: {
        ...resource,
        collegeId: 1,
      },
    });
  }

  console.log("✅ Created resources");
  console.log("🎉 Seed completed!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
