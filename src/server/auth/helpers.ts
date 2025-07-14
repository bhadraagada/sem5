import { Role, UserState } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "./config";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
  state: UserState;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return null;
  }

  return {
    id: (session.user as any).id,
    email: session.user.email!,
    name: session.user.name || undefined,
    role: (session.user as any).role as Role,
    state: (session.user as any).state as UserState,
  };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  if (user.state !== UserState.ACTIVE) {
    throw new Error("Account not active");
  }

  return user;
}

export async function requireRole(
  allowedRoles: Role[],
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

export function withAuth(
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth();
      return await handler(req, user);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Authentication failed",
        },
        { status: 401 },
      );
    }
  };
}

export function withRole(
  allowedRoles: Role[],
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    try {
      const user = await requireRole(allowedRoles);
      return await handler(req, user);
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
  };
}

// Client-side hook for redirecting based on auth state
export function getRedirectPath(user: AuthenticatedUser | null): string | null {
  if (!user) {
    return "/auth/signin";
  }

  if (user.state === UserState.PENDING) {
    if (user.role === Role.ORG_ADMIN) {
      return "/onboarding/admin";
    } else if (user.role === Role.DEPT_COORD) {
      return "/onboarding/faculty";
    } else {
      return "/pending-approval";
    }
  }

  return null; // User is active, no redirect needed
}
