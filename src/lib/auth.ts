import { auth } from "@/server/auth";
import { type Role } from "@/types/next-auth";
import { type Session } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
  user: Session["user"];
}

/**
 * Middleware to require authentication and specific roles
 */
export function requireRole(
  allowedRoles: Role[] = [],
  options: { mustBeActive?: boolean } = {},
) {
  const { mustBeActive = true } = options;

  return function <T>(
    handler: (req: AuthenticatedRequest, context: T) => Promise<NextResponse>,
  ) {
    return async (req: NextRequest, context: T): Promise<NextResponse> => {
      try {
        const session = await auth();

        // Check if user is authenticated
        if (!session?.user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
          );
        }

        // Check if user must be active
        if (mustBeActive && session.user.state !== "ACTIVE") {
          return NextResponse.json(
            { error: "Account pending approval" },
            { status: 403 },
          );
        }

        // Check if user has required role
        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(session.user.role)
        ) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 },
          );
        }

        // Add user to request object
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = session.user;

        return handler(authenticatedReq, context);
      } catch (error) {
        console.error("Auth middleware error:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    };
  };
}

/**
 * Helper to check if user has permission to manage another user
 */
export function canManageUser(managerRole: Role, targetRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    SUPER_ADMIN: 6,
    ORG_ADMIN: 5,
    DEPT_HOD: 4,
    DEPT_COORD: 3,
    RESOURCE_MANAGER: 2,
    CLUB_MEMBER: 1,
  };

  const managerLevel = roleHierarchy[managerRole];
  const targetLevel = roleHierarchy[targetRole];

  return (
    managerLevel !== undefined &&
    targetLevel !== undefined &&
    managerLevel > targetLevel
  );
}

/**
 * Simple helper to get the current authenticated user
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Helper to check if current user has specific role
 */
export async function hasRole(role: Role | Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
}

/**
 * Helper to check if current user is active
 */
export async function isActiveUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.state === "ACTIVE";
}
