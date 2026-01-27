# Data Access Layer (DAL) & DTO Architecture Plan

> Architecture plan for implementing a clean Data Access Layer with DTOs, using Better Auth with Azure Entra ID.

## Overview

This document outlines the implementation plan for a type-safe Data Access Layer (DAL) and Data Transfer Object (DTO) architecture. The design is inspired by the patterns in `pro-dal-local` but adapted for:

- **Better Auth** with stateless JWT sessions
- **Azure Entra ID** (Microsoft) OAuth
- **Role-based access control** (admin, moderator, user)

---

## Current State

### Existing Authentication Infrastructure

| File | Purpose |
|------|---------|
| `/lib/auth.ts` | Better Auth server config with Azure AD |
| `/lib/auth-client.ts` | Client-side auth utilities |
| `/lib/auth-utils.ts` | RBAC helpers (hasRole, requireRole, isAdmin) |
| `/lib/dal/verifySession.ts` | Session verification for protected endpoints |
| `/env.ts` | Zod-validated environment schema |

### Existing Session Interface

```typescript
interface Session {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
}
```

---

## Target Directory Structure

```
lib/
├── auth.ts                      # Better Auth config (existing)
├── auth-client.ts               # Client auth utilities (existing)
├── auth-utils.ts                # RBAC helpers (existing)
├── db.ts                        # Prisma client singleton (NEW)
├── dal/
│   ├── verifySession.ts         # Session verification (existing)
│   ├── user/
│   │   ├── user.dal.ts          # User DAL implementation
│   │   ├── user.dto.ts          # User DTOs and schemas
│   │   └── user.policy.ts       # User authorization policies
│   ├── incident/
│   │   ├── incident.dal.ts      # Incident DAL implementation
│   │   ├── incident.dto.ts      # Incident DTOs and schemas
│   │   └── incident.policy.ts   # Incident authorization policies
│   └── radio-traffic/
│       ├── radio-traffic.dal.ts # Radio traffic DAL
│       ├── radio-traffic.dto.ts # Radio traffic DTOs
│       └── radio-traffic.policy.ts
app/
├── actions/
│   ├── user.actions.ts          # User server actions
│   ├── incident.actions.ts      # Incident server actions
│   └── radio-traffic.actions.ts # Radio traffic server actions
├── schemas/
│   ├── user.ts                  # Form validation schemas
│   ├── incident.ts
│   └── radio-traffic.ts
```

---

## Implementation Patterns

### 1. DAL Class Pattern

Each entity gets a DAL class with factory methods for different access levels:

```typescript
// lib/dal/incident/incident.dal.ts
import "server-only";
import { verifySession } from "../verifySession";
import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { canViewIncident, canCreateIncident, canEditIncident } from "./incident.policy";
import {
  IncidentDTO,
  IncidentCreateInput,
  IncidentCreateInputSchema,
  IncidentUpdateInput,
  IncidentUpdateInputSchema,
} from "./incident.dto";

export class IncidentDAL {
  private constructor(
    private readonly userId: string,
    private readonly userRole: UserRole
  ) {}

  /**
   * Factory for authenticated operations (create, update, delete)
   * Requires a valid session
   */
  static async create() {
    const session = await verifySession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    return new IncidentDAL(session.userId, session.user.role);
  }

  /**
   * Factory for read-only operations
   * Returns null user context if not authenticated
   */
  static async public() {
    const session = await verifySession().catch(() => null);
    return new IncidentDAL(
      session?.userId ?? "",
      session?.user.role ?? "user"
    );
  }

  /**
   * Factory for admin-only operations
   */
  static async admin() {
    const session = await verifySession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    requireRole(session.user.role, "admin");
    return new IncidentDAL(session.userId, session.user.role);
  }

  async listIncidents(): Promise<IncidentDTO[]> {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
    });

    return incidents.filter((incident) =>
      canViewIncident({ id: this.userId, role: this.userRole }, incident)
    );
  }

  async getIncident(id: string): Promise<IncidentDTO | null> {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return null;

    if (!canViewIncident({ id: this.userId, role: this.userRole }, incident)) {
      throw new Error("Not authorized to view this incident");
    }

    return incident;
  }

  async createIncident(input: IncidentCreateInput): Promise<IncidentDTO> {
    // Validate input
    const parsed = IncidentCreateInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid input");
    }

    // Check authorization
    if (!canCreateIncident({ id: this.userId, role: this.userRole })) {
      throw new Error("Not authorized to create incidents");
    }

    return prisma.incident.create({
      data: {
        ...parsed.data,
        createdById: this.userId,
      },
    });
  }

  async updateIncident(id: string, input: IncidentUpdateInput): Promise<IncidentDTO> {
    const parsed = IncidentUpdateInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid input");
    }

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Incident not found");
    }

    if (!canEditIncident({ id: this.userId, role: this.userRole }, existing)) {
      throw new Error("Not authorized to edit this incident");
    }

    return prisma.incident.update({
      where: { id },
      data: parsed.data,
    });
  }
}
```

### 2. DTO Pattern with Zod

Separate input and output DTOs with Zod schemas:

```typescript
// lib/dal/incident/incident.dto.ts
import "server-only";
import { z } from "zod";

// --- Output DTOs ---

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  createdById: z.string(),
  assignedToId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IncidentDTO = z.infer<typeof IncidentSchema>;

// --- Input DTOs ---

export const IncidentCreateInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export type IncidentCreateInput = z.infer<typeof IncidentCreateInputSchema>;

export const IncidentUpdateInputSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export type IncidentUpdateInput = z.infer<typeof IncidentUpdateInputSchema>;

// --- List Response DTO ---

export const IncidentListResponseSchema = z.object({
  incidents: z.array(IncidentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;
```

### 3. Policy Pattern

Centralized authorization logic:

```typescript
// lib/dal/incident/incident.policy.ts
import "server-only";
import type { UserRole } from "@/lib/auth-utils";

interface PolicyUser {
  id: string;
  role: UserRole;
}

interface PolicyIncident {
  id: string;
  createdById: string;
  assignedToId?: string | null;
}

/**
 * Check if user can view an incident
 * - Admins and moderators can view all
 * - Users can view incidents they created or are assigned to
 */
export function canViewIncident(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "moderator") return true;
  return incident.createdById === user.id || incident.assignedToId === user.id;
}

/**
 * Check if user can create incidents
 * - All authenticated users can create incidents
 */
export function canCreateIncident(user: PolicyUser | null): boolean {
  return Boolean(user);
}

/**
 * Check if user can edit an incident
 * - Admins can edit all
 * - Moderators can edit all
 * - Users can only edit incidents they created
 */
export function canEditIncident(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "moderator") return true;
  return incident.createdById === user.id;
}

/**
 * Check if user can delete an incident
 * - Only admins can delete
 */
export function canDeleteIncident(user: PolicyUser | null): boolean {
  return user?.role === "admin";
}

/**
 * Check if user can assign incidents
 * - Admins and moderators can assign
 */
export function canAssignIncident(user: PolicyUser | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "moderator";
}
```

### 4. Server Actions Pattern

Server actions that use the DAL:

```typescript
// app/actions/incident.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { IncidentDAL } from "@/lib/dal/incident/incident.dal";
import {
  IncidentCreateInput,
  IncidentCreateInputSchema,
  IncidentUpdateInput,
  IncidentUpdateInputSchema,
} from "@/lib/dal/incident/incident.dto";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createIncidentAction(
  input: IncidentCreateInput
): Promise<ActionResult<{ id: string }>> {
  // Validate input
  const parsed = IncidentCreateInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const dal = await IncidentDAL.create();
    const incident = await dal.createIncident(parsed.data);
    revalidatePath("/incidents");
    return { ok: true, data: { id: incident.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function updateIncidentAction(
  id: string,
  input: IncidentUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = IncidentUpdateInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const dal = await IncidentDAL.create();
    const incident = await dal.updateIncident(id, parsed.data);
    revalidatePath("/incidents");
    revalidatePath(`/incidents/${id}`);
    return { ok: true, data: { id: incident.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}

export async function listIncidentsAction(): Promise<ActionResult<{ incidents: any[] }>> {
  try {
    const dal = await IncidentDAL.public();
    const incidents = await dal.listIncidents();
    return { ok: true, data: { incidents } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
```

### 5. Database Singleton

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

## Integration with Better Auth & Azure Entra

### Session Verification (Enhanced)

Update the existing `verifySession.ts` to work with the DAL pattern:

```typescript
// lib/dal/verifySession.ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/auth-utils";
import { env } from "@/env";
import { DEV_USER } from "@/lib/constants";

export interface Session {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
}

/**
 * Verify and return the current session
 * Cached per request to avoid multiple auth calls
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  // Development bypass
  if (env.DISABLE_AUTH) {
    return {
      userId: DEV_USER.id,
      user: DEV_USER,
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      image: session.user.image,
      role: (session.user.role as UserRole) ?? "user",
    },
  };
});

/**
 * Require a valid session, throws if not authenticated
 */
export const requireSession = cache(async (): Promise<Session> => {
  const session = await verifySession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
});

/**
 * Get current user or null (for optional auth)
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  return session?.user ?? null;
});
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  createdIncidents  Incident[] @relation("CreatedIncidents")
  assignedIncidents Incident[] @relation("AssignedIncidents")
  radioTraffic      RadioTraffic[]
}

model Incident {
  id          String         @id @default(uuid())
  title       String
  description String
  status      IncidentStatus @default(OPEN)
  priority    Priority       @default(MEDIUM)

  createdById  String
  createdBy    User   @relation("CreatedIncidents", fields: [createdById], references: [id])
  assignedToId String?
  assignedTo   User?  @relation("AssignedIncidents", fields: [assignedToId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  radioTraffic RadioTraffic[]

  @@index([status])
  @@index([priority])
  @@index([createdById])
  @@index([assignedToId])
}

model RadioTraffic {
  id           String   @id @default(uuid())
  incidentId   String
  incident     Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  audioUrl     String
  duration     Int      // Duration in seconds
  transcription Json    // TranscriptionSegment[]
  metadata     Json?    // Additional metadata

  uploadedById String
  uploadedBy   User   @relation(fields: [uploadedById], references: [id])

  createdAt DateTime @default(now())

  @@index([incidentId])
  @@index([uploadedById])
}

enum Role {
  USER
  MODERATOR
  ADMIN
}

enum IncidentStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Component                          │
│                    (Form / UI Interaction)                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server Action                             │
│              (app/actions/incident.actions.ts)                   │
│                                                                  │
│  1. Validate input with Zod schema                              │
│  2. Create DAL instance via factory method                       │
│  3. Call DAL method                                             │
│  4. Return discriminated union result                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                            DAL                                   │
│              (lib/dal/incident/incident.dal.ts)                  │
│                                                                  │
│  1. Factory verifies session via Better Auth                     │
│  2. Policy check for authorization                              │
│  3. Execute database operation via Prisma                        │
│  4. Return DTO                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐
    │      Policy Layer        │   │     Prisma ORM          │
    │  (incident.policy.ts)    │   │      (lib/db.ts)        │
    │                          │   │                         │
    │  Authorization checks    │   │  Database operations    │
    │  based on user role      │   │  PostgreSQL             │
    └─────────────────────────┘   └─────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Install Prisma: `pnpm add prisma @prisma/client`
- [ ] Initialize Prisma: `pnpm prisma init`
- [ ] Create schema (see above)
- [ ] Run migration: `pnpm prisma migrate dev`
- [ ] Create `/lib/db.ts` singleton

### Phase 2: Core DAL Infrastructure
- [ ] Update `/lib/dal/verifySession.ts` with enhanced patterns
- [ ] Create base types in `/lib/dal/types.ts`

### Phase 3: User DAL
- [ ] Create `/lib/dal/user/user.dto.ts`
- [ ] Create `/lib/dal/user/user.policy.ts`
- [ ] Create `/lib/dal/user/user.dal.ts`
- [ ] Create `/app/actions/user.actions.ts`

### Phase 4: Incident DAL
- [ ] Create `/lib/dal/incident/incident.dto.ts`
- [ ] Create `/lib/dal/incident/incident.policy.ts`
- [ ] Create `/lib/dal/incident/incident.dal.ts`
- [ ] Create `/app/actions/incident.actions.ts`
- [ ] Create `/app/schemas/incident.ts` (form validation)

### Phase 5: Radio Traffic DAL
- [ ] Create `/lib/dal/radio-traffic/radio-traffic.dto.ts`
- [ ] Create `/lib/dal/radio-traffic/radio-traffic.policy.ts`
- [ ] Create `/lib/dal/radio-traffic/radio-traffic.dal.ts`
- [ ] Update `/app/api/radio-traffic/route.ts` to use DAL
- [ ] Create `/app/actions/radio-traffic.actions.ts`

### Phase 6: Testing
- [ ] Add unit tests for policy functions
- [ ] Add integration tests for DAL methods
- [ ] Add E2E tests for server actions

---

## Key Design Principles

1. **Server-Only**: All DAL and DTO files use `import "server-only"` to prevent client-side leakage

2. **Factory Pattern**: DAL classes use static factory methods for different access levels:
   - `create()` - Requires authentication
   - `public()` - Optional authentication (read-only)
   - `admin()` - Requires admin role

3. **Separation of Concerns**:
   - DTOs handle validation and type definitions
   - Policies handle authorization logic
   - DAL handles data access and business logic
   - Actions handle request/response orchestration

4. **Type Safety**: Zod schemas provide runtime validation and TypeScript type inference

5. **Discriminated Unions**: Server actions return `{ ok: true, data } | { ok: false, error }` for type-safe error handling

6. **Request Caching**: Use React `cache()` for session verification to avoid duplicate auth calls per request

7. **RBAC Integration**: Policies leverage the existing role system (admin, moderator, user) from Better Auth

---

## Environment Variables

Add to `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nothing?schema=public"

# Existing Better Auth config
BETTER_AUTH_SECRET="your-32-char-minimum-secret"
BETTER_AUTH_URL="http://localhost:3000"
MICROSOFT_CLIENT_ID="your-azure-client-id"
MICROSOFT_CLIENT_SECRET="your-azure-client-secret"
MICROSOFT_TENANT_ID="your-tenant-id-or-common"

# Development
DISABLE_AUTH="true"  # Optional: bypass auth in development
```

Update `/env.ts` to include `DATABASE_URL`:

```typescript
const envSchema = z.object({
  // ... existing fields
  DATABASE_URL: z.string().url(),
});
```
