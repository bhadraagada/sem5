# College Resource Management System

A multi-tenant SaaS application for managing college resources with role-based access control (RBAC) and Google OAuth authentication.

## Features

- **Multi-tenant Architecture**: Single database with row-level isolation by `tenantId`
- **Google OAuth Authentication**: Secure sign-in with Google accounts
- **Role-Based Access Control (RBAC)**: Six different user roles with hierarchical permissions
- **Pending User Approval**: New users require approval from Organization Admins
- **Public Calendar API**: No-auth endpoint for approved public events
- **Real-time Notifications**: Email notifications for admin actions

## User Roles

1. **SUPER_ADMIN**: System owner with full access
2. **ORG_ADMIN**: College IT/main office administrators
3. **DEPT_HOD**: Head of department
4. **DEPT_COORD**: Department coordinator
5. **CLUB_MEMBER**: Basic user (default role)
6. **RESOURCE_MANAGER**: Manages specific resources

## User States

- **PENDING**: Newly registered users awaiting approval
- **ACTIVE**: Approved users with full access
- **SUSPENDED**: Temporarily disabled accounts

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Authentication**: NextAuth.js 5 (Auth.js) with Google OAuth
- **Database**: Neon PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd sem5
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth.js
AUTH_SECRET="your-random-secret-string"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Multi-tenant settings
DEFAULT_TENANT_SLUG="your-college-slug"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Configure authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open Prisma Studio
pnpm db:studio
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## API Routes

### Authentication Required

- `GET /api/admin/pending-users` - List pending users (ORG_ADMIN+)
- `PUT /api/admin/users/:id` - Approve/manage users (ORG_ADMIN+)

### Public API

- `GET /api/public/:tenantSlug/calendar` - Public calendar events (no auth)

## Database Schema

### Core Models

- **Tenant**: Organization/college
- **User**: System users with roles and states
- **Department**: College departments
- **Resource**: Bookable resources (classrooms, labs, etc.)
- **Event**: Resource bookings/events

### Key Relationships

- Users belong to a Tenant
- Resources belong to a Tenant and optionally a Department
- Events link Users, Resources, and Tenants
- Double-booking prevention via unique constraints

## Authentication Flow

1. User clicks "Sign in with Google"
2. Google OAuth redirects back with profile
3. System creates user with `PENDING` state and `CLUB_MEMBER` role
4. Org Admins receive email notification
5. User sees "Awaiting Approval" page until approved
6. Org Admin approves user → state changes to `ACTIVE`
7. User receives approval email and gains full access

## RBAC Implementation

### Middleware Protection

```typescript
import { requireRole } from "@/lib/auth";

export const GET = requireRole(["ORG_ADMIN", "SUPER_ADMIN"])(handler);
```

### Role Hierarchy Checks

```typescript
import { canManageUser } from "@/lib/auth";

if (!canManageUser(currentUser.role, targetUser.role)) {
  return NextResponse.json(
    { error: "Insufficient permissions" },
    { status: 403 },
  );
}
```

### Client-Side Role Checks

```typescript
import { hasRole } from "@/lib/auth";

const isAdmin = await hasRole(["ORG_ADMIN", "SUPER_ADMIN"]);
```

## Email Notifications

The system includes email notification helpers in `/src/lib/email.ts`:

- New user signup notifications to Org Admins
- User approval notifications

To implement actual email sending, integrate with:

- [Resend](https://resend.com/)
- [SendGrid](https://sendgrid.com/)
- [AWS SES](https://aws.amazon.com/ses/)

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with production credentials
- Set proper `AUTH_SECRET` (use `npx auth secret`)
- Update `DATABASE_URL` to production database
- Configure proper domain in Google OAuth settings

## Development Commands

```bash
# Database
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run database migrations
pnpm db:push         # Push schema changes (development)
pnpm db:studio       # Open Prisma Studio

# Development
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm start           # Start production server

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm typecheck       # Run TypeScript checks
pnpm format:check    # Check Prettier formatting
pnpm format:write    # Fix Prettier formatting
```

## Security Considerations

- JWT tokens include user role and state for quick access checks
- Database queries filtered by `tenantId` for multi-tenant isolation
- Role hierarchy prevents privilege escalation
- Middleware enforces authentication on all protected routes
- User state checks prevent suspended users from accessing system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Your License Here]
