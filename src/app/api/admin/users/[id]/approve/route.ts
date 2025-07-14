import { db } from "@/server/db";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const approveUserSchema = z.object({
  approved: z.boolean(),
  role: z.enum(["CLUB_MEMBER", "DEPT_COORD", "RESOURCE_MANAGER"]).optional(),
});

async function handler(req: NextRequest, context: { params: { id: string } }) {
  const userId = context.params.id;

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { approved, role } = approveUserSchema.parse(body);

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.state !== "PENDING") {
        return NextResponse.json(
          { error: "User is not in pending state" },
          { status: 400 },
        );
      }

      if (approved) {
        // Approve the user
        const updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            state: "ACTIVE",
            role: role ?? user.role,
          },
        });

        return NextResponse.json({
          message: "User approved successfully",
          user: updatedUser,
        });
      } else {
        // Reject the user (delete the account)
        await db.user.delete({
          where: { id: userId },
        });

        return NextResponse.json({
          message: "User rejected and account deleted",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: error.errors },
          { status: 400 },
        );
      }

      console.error("Error approving/rejecting user:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } },
) {
  // Manual auth check for route with params
  try {
    const { requireRole } = await import("@/server/auth/helpers");
    await requireRole([Role.ORG_ADMIN]);
    return await handler(req, context);
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Insufficient permissions"
        ? 403
        : 401;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied" },
      { status },
    );
  }
}
