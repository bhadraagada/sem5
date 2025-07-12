import { requireRole, type AuthenticatedRequest } from "@/lib/auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

async function handler(req: AuthenticatedRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { user } = req;

    // Get pending users for the current tenant
    const pendingUsers = await db.user.findMany({
      where: {
        tenantId: user.tenantId,
        state: "PENDING",
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = requireRole(["ORG_ADMIN", "SUPER_ADMIN"])(handler);
