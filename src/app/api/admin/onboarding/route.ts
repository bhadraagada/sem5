import { requireRole } from "@/server/auth/helpers";
import { db } from "@/server/db";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const onboardingSchema = z.object({
  college: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
  }),
  buildings: z.array(
    z.object({
      name: z.string(),
      floors: z.number(),
      rooms: z.array(
        z.object({
          name: z.string(),
          capacity: z.number(),
          type: z.enum(["CLASSROOM", "LAB", "AUDITORIUM", "CONFERENCE"]),
        }),
      ),
    }),
  ),
  departments: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  resources: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      notes: z.string().optional(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    // Check permissions
    const user = await requireRole([Role.ORG_ADMIN]);

    if (user.state !== "PENDING") {
      return NextResponse.json(
        { error: "User is not in pending state" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const data = onboardingSchema.parse(body);

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Update college information
      await tx.college.update({
        where: { id: 1 },
        data: {
          name: data.college.name,
          address: data.college.address,
          city: data.college.city,
          contactEmail: data.college.contactEmail,
          contactPhone: data.college.contactPhone,
        },
      });

      // Create buildings and rooms
      for (const building of data.buildings) {
        const createdBuilding = await tx.building.create({
          data: {
            name: building.name,
            floors: building.floors,
            collegeId: 1,
          },
        });

        for (const room of building.rooms) {
          await tx.room.create({
            data: {
              name: room.name,
              capacity: room.capacity,
              type: room.type,
              buildingId: createdBuilding.id,
            },
          });
        }
      }

      // Create departments
      for (const dept of data.departments) {
        await tx.department.upsert({
          where: { name: dept.name },
          update: {},
          create: {
            name: dept.name,
            collegeId: 1,
          },
        });
      }

      // Create resources
      for (const resource of data.resources) {
        await tx.resource.create({
          data: {
            name: resource.name,
            quantity: resource.quantity,
            notes: resource.notes,
            collegeId: 1,
          },
        });
      }

      // Activate the admin user
      await tx.user.update({
        where: { id: user.id },
        data: { state: "ACTIVE" },
      });
    });

    return NextResponse.json({
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
