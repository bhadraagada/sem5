import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publicEvents = await db.event.findMany({
      where: {
        status: "APPROVED",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        room: {
          select: {
            name: true,
            building: {
              select: {
                name: true,
              },
            },
          },
        },
        creator: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ events: publicEvents });
  } catch (error) {
    console.error("Error fetching public calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
