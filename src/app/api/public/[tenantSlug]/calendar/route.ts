/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantSlug: string } },
) {
  try {
    const { tenantSlug } = params;

    // Find the tenant
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get approved and public events
    const events = await db.event.findMany({
      where: {
        tenantId: tenant.id,
        status: "APPROVED",
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching public calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
