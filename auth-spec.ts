/* ========================================================================
   🚀  Copilot Prompt — Single-Tenant Auth & RBAC for Jai Hind College
   ========================================================================

System context
--------------
• Next.js 15  (App Router) + React 19 + TypeScript  
• NextAuth.js 4  — providers: Google OAuth **and** Credentials  
• Database: Neon PostgreSQL  (single DB, single college)  
• ORM: Prisma  
• Hosting: Vercel (web & API routes)

High-level requirements
-----------------------
1.  **One college only** (Jai Hind College) — no tenant IDs anywhere. 🆕  
2.  First person to sign-in becomes `ORG_ADMIN` and is forced through an
    **admin onboarding wizard** that captures:  
        • College profile (name, logo, address, contact)  
        • Buildings & rooms (name, type, capacity)  
        • Departments + choose their HODs (can skip for now)  
        • Shared resources (projectors, speakers, etc.)  
    After finishing, their `state` flips from `PENDING` → `ACTIVE`.  
3.  Faculty auto-signup if e-mail ends with `@jaihindcollege.edu.in`
    (role =`DEPT_COORD`, state =`PENDING`, then they complete a **teacher
    onboarding wizard** → state =`ACTIVE`). 🆕  
4.  Club / student users must fill a **request-account form**.  
    Admins approve in `/admin/users` — no manual DB edits. 🆕  
5.  Roles & RBAC:  
    ```
    SUPER_ADMIN   // optional fallback
    ORG_ADMIN     // college IT
    DEPT_HOD
    DEPT_COORD
    CLUB_MEMBER
    RESOURCE_MANAGER
    ```
6.  Public calendar endpoint shows **APPROVED + PUBLIC** events.  
7.  Every server action/API route guarded by `requireRole()` helper.

Prisma schema (single-tenant)
-----------------------------
```prisma
model College {
  id          Int      @id @default(1)
  name        String
  slug        String   @unique
  logoUrl     String?
  address     String?
  city        String?
  contactEmail String?
  contactPhone String?
  createdAt   DateTime @default(now())
  // relations
  users       User[]
  departments Department[]
  buildings   Building[]
  resources   Resource[]
  events      Event[]
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String?   // bcrypt hash – null for Google-only
  googleId  String?   @unique
  name      String?
  phone     String?
  photoUrl  String?
  role      Role      @default(CLUB_MEMBER)
  state     UserState @default(PENDING)
  deptId    String?
  collegeId Int       @default(1)
  college   College   @relation(fields:[collegeId], references:[id])
  department Department? @relation(fields:[deptId], references:[id])
  createdEvents Event[] @relation("EventCreator")
  createdAt DateTime  @default(now())
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

model Department {
  id        String   @id @default(cuid())
  name      String   @unique
  hodId     String?  @unique
  collegeId Int      @default(1)
  college   College  @relation(fields:[collegeId], references:[id])
  hod       User?    @relation("HOD", fields:[hodId], references:[id])
  users     User[]
}

model Building {
  id        String  @id @default(cuid())
  name      String
  floors    Int
  collegeId Int     @default(1)
  college   College @relation(fields:[collegeId], references:[id])
  rooms     Room[]
}

model Room {
  id         String   @id @default(cuid())
  buildingId String
  building   Building @relation(fields:[buildingId], references:[id])
  name       String
  capacity   Int
  type       RoomType
  events     Event[]
  resources  Resource[] @relation("RoomResources")
}

enum RoomType {
  CLASSROOM
  LAB
  AUDITORIUM
  CONFERENCE
}

model Resource {
  id        String  @id @default(cuid())
  name      String
  quantity  Int
  notes     String?
  collegeId Int     @default(1)
  college   College @relation(fields:[collegeId], references:[id])
  rooms     Room[]  @relation("RoomResources")
}

model Event {
  id          String      @id @default(cuid())
  createdById String
  creator     User        @relation("EventCreator", fields:[createdById], references:[id])
  title       String
  startTime   DateTime
  endTime     DateTime
  visibility  Visibility
  status      EventStatus @default(PENDING)
  roomId      String?
  room        Room?       @relation(fields:[roomId], references:[id])
  collegeId   Int         @default(1)
  college     College     @relation(fields:[collegeId], references:[id])
  
  @@unique([roomId, startTime, endTime])
}

enum Visibility {
  PUBLIC
  PRIVATE
}

enum EventStatus {
  APPROVED
  PENDING
  REJECTED
}
```

## NextAuth config

```ts
import GoogleProvider      from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash }   from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({ clientId, clientSecret }),
    CredentialsProvider({
      name: "Credentials",
      credentials: { email:{}, password:{} },
      async authorize({ email, password }) {
        const user = await prisma.user.findUnique({ where:{ email } })
        if (!user || !user.password) return null
        const ok = await compare(password, user.password)
        return ok && user.state === "ACTIVE" ? user : null
      }
    })
  ],
  session:{ strategy:"jwt" },
  callbacks:{
    async jwt({ token, user }) {
      if (user) {
        token.uid   = user.id
        token.role  = user.role
        token.state = user.state
      }
      return token
    },
    async session({ session, token }) {
      session.user.id   = token.uid
      session.user.role = token.role
      session.user.state= token.state
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        return handleGoogleLogin(profile)
      }
      return true
    }
  }
}
```

`handleGoogleLogin(profile)` 🆕

```ts
const FACULTY_DOMAIN = "jaihindcollege.edu.in"

async function handleGoogleLogin(profile: GoogleProfile) {
  const email = profile.email!
  const isFaculty = email.endsWith(`@${FACULTY_DOMAIN}`)

  let user = await prisma.user.findUnique({ where:{ email } })

  // ---------- first ever login => bootstrap college admin ----------
  if (!user && (await prisma.user.count()) === 0) {
    user = await prisma.user.create({
      data:{
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role: "ORG_ADMIN",
        state: "PENDING" // will complete wizard
      }
    })
    return true
  }

  // ---------- faculty auto-provision ----------
  if (!user && isFaculty) {
    user = await prisma.user.create({
      data:{
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role: "DEPT_COORD",
        state:"PENDING" // teacher wizard
      }
    })
    return true
  }

  // ---------- club member / unknown e-mail ----------
  if (!user) {
    user = await prisma.user.create({
      data:{
        email,
        googleId: profile.sub,
        name: profile.name,
        photoUrl: profile.picture,
        role:"CLUB_MEMBER",
        state:"PENDING"
      }
    })
    notifyAdminsForApproval(user.email)
    return true
  }

  // existing user: update googleId if missing
  if (!user.googleId) {
    await prisma.user.update({
      where:{ id:user.id },
      data:{ googleId: profile.sub }
    })
  }
  return true
}
```

## Helper guards

```ts
export const requireSession = (handler:NextApiHandler) =>
  async (req,res) => {
    const session = await getServerSession(req,res,authOptions)
    if (!session) return res.status(401).end("Unauthenticated")
    // attach for downstream use
    req.user = session.user as any
    return handler(req,res)
  }

export const requireRole = (roles:Role[]) =>
  requireSession(async (req,res) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error:"Forbidden" })
    }
  })
```

## API surface

| Method & Path                            | Purpose                                    | Roles      |
| ---------------------------------------- | ------------------------------------------ | ---------- |
| **POST** `/api/request-account`          | Club member request form → `User(PENDING)` | PUBLIC     |
| **GET**  `/api/admin/pending-users`      | List users where `state=PENDING`           | ORG\_ADMIN |
| **PUT**  `/api/admin/users/:id/approve`  | Set `state=ACTIVE`, maybe promote role     | ORG\_ADMIN |
| **POST** `/api/admin/users/:id/reset-pw` | Email "set password" link                  | ORG\_ADMIN |
| **GET**  `/api/public/calendar`          | Approved & public events                   | PUBLIC     |

## On-boarding wizards (multi-step)

### `ORG_ADMIN`  → `/onboarding/admin`

1. **College profile** — name (defaults to Jai Hind College), logo, address, city, contact email/phone.
2. **Buildings & rooms** — repeatable: building name, floors, rooms (name, type, capacity).
3. **Departments** — list dept names, optional HOD assignment.
4. **Resources** — e.g., projectors, speakers, computers w/ qty.
5. **Finish** → `state=ACTIVE`, redirect to `/admin`.

### `DEPT_COORD` / faculty  → `/onboarding/faculty`

1. Personal details (phone, photo).
2. Select department, designation.
3. Finish → `state=ACTIVE`.

### Club request form

* Club name & e-mail
* Purpose / description
* Expected resources (text)
* Captcha / terms

## Important DB columns added

```prisma
model User  { password? phone photoUrl deptId state role }
model Room  { type capacity }
model College { logoUrl contactEmail ... }
```

## Security notes

* Credentials path: hash with `bcryptjs` (edge-compatible).
* Google tokens verified by NextAuth.
* Unique index `(roomId, startTime, endTime)` prevents double bookings.
* Rate-limit `/api/request-account`.

╭──────────────────────────────────────────────────────────────────────────╮
│  Paste this prompt, then let Copilot scaffold:                          │
│  • Prisma migrations + seed Jai Hind College row (id = 1)               │
│  • `[...nextauth].ts` with both providers & callbacks                   │
│  • On-boarding React steps (React-Hook-Form + Zod)                      │
│  • Admin pages (`/admin/users`, `/admin/resources`, …)                  │
│  • API routes protected by helpers                                      │
╰──────────────────────────────────────────────────────────────────────────╯

### Next steps for you

1. **Create** the Prisma migration from the schema above (`npx prisma migrate dev`).  
2. **Seed** the `College` table with a single row (ID = 1) for Jai Hind College.  
3. **Drop** this prompt in `auth-spec.ts` (or README) and start invoking Copilot:  
   * accept suggested files, tweak field names, add tests.  
4. **Deploy** to Vercel → set ENV vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`.  

Enjoy your streamlined, single-tenant auth stack!
*/
