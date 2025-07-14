import { type DefaultSession } from "next-auth";

export type Role =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "DEPT_HOD"
  | "DEPT_COORD"
  | "CLUB_MEMBER"
  | "RESOURCE_MANAGER";
export type UserState = "PENDING" | "ACTIVE" | "SUSPENDED";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      tenantId: string;
      role: Role;
      state: UserState;
      googleId: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string;
    role: Role;
    state: UserState;
    googleId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    role: Role;
    state: UserState;
    googleId: string;
  }
}
