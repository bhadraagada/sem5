import { withRole } from "@/server/auth/helpers";
import { db } from "@/server/db";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  // Get all pending users
  const pendingUsers = await db.user.findMany({
    where: {
      state: "PENDING",
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ users: pendingUsers });
}

export const GET = withRole([Role.ORG_ADMIN], handler);
