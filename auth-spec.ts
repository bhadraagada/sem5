/* ========================================================================
   🚀  Copilot Prompt — Multi-Tenant Auth & RBAC for College Resource SaaS
   ========================================================================

Project context
---------------
• Front end: Next.js 15 (App Router) + React 19 + TypeScript  
• Auth: NextAuth.js 4 (aka Auth.js) using Google OAuth provider  
• DB: Neon PostgreSQL (shared DB, row-level isolation by `tenantId`)  
• ORM: Prisma  
• Hosting: Vercel (web + API routes)

High-level goals
----------------
1.  Multi-tenant SaaS: one database, each row carries `tenantId`.  
2.  Google SSO for everyone. New users land in **pending** state until an
    Org Admin approves them.  
3.  Role-based access control (RBAC) for:
    - `SUPER_ADMIN` (system owner)  
    - `ORG_ADMIN`   (college IT / main office)  
    - `DEPT_HOD`    (head of department)  
    - `DEPT_COORD`  (department coordinator)  
    - `CLUB_MEMBER`  
    - `RESOURCE_MANAGER`  
4.  Public, no-auth calendar endpoint that shows **approved + public**
    events only.  
5.  Guard every API route and server action with a one-liner helper.

Prisma schema sketch
--------------------
```prisma
model Tenant {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  users       User[]
  departments Department[]
  resources   Resource[]
  events      Event[]
}

model User {
  id        String  @id @default(cuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  email     String  @unique
  name      String
  googleId  String  @unique
  role      Role    @default(CLUB_MEMBER)
  state     UserState @default(PENDING)
  createdAt DateTime @default(now())
}

enum Role {
  SUPER_ADMIN
  ORG_ADMIN
  DEPT_HOD
  DEPT_COORD
  CLUB_MEMBER
  RESOURCE_MANAGER
}

enum UserState {
  PENDING
  ACTIVE
  SUSPENDED
}
```

## NextAuth config requirements

1. `session.strategy = "jwt"`
2. JWT **must** embed `uid`, `tenantId`, `role`, `state`.
3. Callback logic:

   * If Google ID not found → create `User` with `state=PENDING`,
     role =`CLUB_MEMBER`, `tenantId` derived from `tenantSlug` in URL.
   * If user `state !== ACTIVE` → redirect to `/pending`.
4. Email Org Admins on auto-signup.

## Minimal helper

```ts
export function requireRole(
  allowed: Role[] = [],
  { mustBeActive = true } = {}
) {
  return async <T extends NextApiHandler>(handler: T) =>
    async (req, res) => {
      const session = await getServerSession(req, res, authOptions)
      if (
        !session ||
        (mustBeActive && session.user.state !== "ACTIVE") ||
        (allowed.length && !allowed.includes(session.user.role))
      ) {
        return res.status(403).json({ error: "Forbidden" })
      }
      req.user = session.user
      return handler(req, res)
    }
}
```

## API routes to generate

* `POST /api/request-account` – self-signup (handled by NextAuth callback).
* `GET  /api/admin/pending-users` – Org Admins list.
* `PUT  /api/admin/users/:id` – approve / change role / suspend.
* `GET  /api/public/:tenantSlug/calendar` – no auth; returns
  `{ events: Event[] }` filtered by `status=APPROVED && visibility=PUBLIC`.

## Edge cases & tests

* User logs in before approval → must see "Awaiting Approval" page.
* Org Admin cannot approve a user from another tenant (check `tenantId`).
* Double-booking protection handled by DB unique constraint
  `(tenantId, resourceId, startTime, endTime)`.

========================================================================= */
