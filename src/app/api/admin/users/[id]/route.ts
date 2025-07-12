import {
  canManageUser,
  requireRole,
  type AuthenticatedRequest,
} from "@/lib/auth";
import { sendUserApprovalNotification } from "@/lib/email";
import { db } from "@/server/db";
import { type Role, type UserState } from "@/types/next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  state: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "ORG_ADMIN",
      "DEPT_HOD",
      "DEPT_COORD",
      "CLUB_MEMBER",
      "RESOURCE_MANAGER",
    ])
    .optional(),
});

async function handler(
  req: AuthenticatedRequest,
  context: { params: { id: string } },
) {
  if (req.method !== "PUT") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { user: currentUser } = req;
    const { params } = context;
    const { id } = params;

    // Parse request body
    const body: unknown = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.errors },
        { status: 400 },
      );
    }

    const { state, role } = result.data;

    // Find the target user
    const targetUser = await db.user.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is in the same tenant
    if (targetUser.tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { error: "Cannot manage users from other organizations" },
        { status: 403 },
      );
    }

    // Check if current user has permission to manage target user
    if (role && !canManageUser(currentUser.role, role as Role)) {
      return NextResponse.json(
        { error: "Cannot assign a role higher than or equal to your own" },
        { status: 403 },
      );
    }

    if (!canManageUser(currentUser.role, targetUser.role as Role)) {
      return NextResponse.json(
        { error: "Cannot manage users with higher or equal privileges" },
        { status: 403 },
      );
    }

    // Update the user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(state && { state: state as UserState }),
        ...(role && { role: role as Role }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        state: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send approval notification if user was activated
    if (state === "ACTIVE" && targetUser.state === "PENDING") {
      await sendUserApprovalNotification(targetUser.email, targetUser.name);
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const PUT = requireRole(["ORG_ADMIN", "SUPER_ADMIN"])(handler);
