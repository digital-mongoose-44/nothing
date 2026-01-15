I now have a clear picture. Let me propose a solution:

---

## Proposed Convention-Based Flow

### 1. File & Folder Conventions

```
feature-repo/
├── src/
│   ├── components/
│   │   └── UserDashboard/
│   │       ├── UserDashboard.tsx        # Main component
│   │       ├── UserDashboard.types.ts   # Types (with markers)
│   │       └── UserDashboard.mock.ts    # Dummy data
│   ├── api/
│   │   └── userApi.ts                   # API calls (with markers)
│   └── lib/
│       └── adapters/
│           └── userAdapter.ts           # Data transformation (with markers)
```

### 2. Marker Convention for Confidential Replacements

Use a consistent comment pattern that's easy to search for:

```typescript
// @REPLACE-PROD: <description of what to replace with>
```

**Example - Types file:**

```typescript
// src/components/UserDashboard/UserDashboard.types.ts

// Generic fields (OK to keep)
export interface User {
  id: string;
  name: string;
  email: string;

  // @REPLACE-PROD: Replace with real compliance fields from UserDTO
  complianceScore: number;
  riskCategory: "low" | "medium" | "high";
  lastAuditDate: string;
}

// @REPLACE-PROD: Replace entire interface with real ReportData from OpenAPI spec
export interface ReportData {
  reportId: string;
  generatedAt: string;
  summary: string;
  metrics: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}
```

**Example - API file:**

```typescript
// src/api/userApi.ts

// @REPLACE-PROD: Replace with real endpoint from API gateway
const USER_ENDPOINT = "https://jsonplaceholder.typicode.com/users";

// @REPLACE-PROD: Replace with real endpoint
const REPORTS_ENDPOINT = "https://dummyjson.com/products";

export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`${USER_ENDPOINT}/${id}`);
  return response.json();
}
```

**Example - Adapter file (for field mapping):**

```typescript
// src/lib/adapters/userAdapter.ts

export function mapApiResponseToUser(raw: unknown): User {
  const data = raw as Record<string, unknown>;

  return {
    // Generic fields (OK to keep)
    id: String(data.id),
    name: String(data.name),
    email: String(data.email),

    // @REPLACE-PROD: Map from real API response fields
    // Currently using dummy mapping:
    complianceScore: Number(data.id) * 10, // @REPLACE-PROD: data.complianceScore
    riskCategory: "low", // @REPLACE-PROD: data.riskLevel
    lastAuditDate: new Date().toISOString(), // @REPLACE-PROD: data.auditTimestamp
  };
}
```

### 3. Mock Data Convention

Keep all dummy data in `*.mock.ts` files:

```typescript
// src/components/UserDashboard/UserDashboard.mock.ts

// @REPLACE-PROD: Delete this entire file in production, use real API calls

export const mockUser: User = {
  id: "1",
  name: "Anna Svensson",
  email: "anna.svensson@example.com",
  complianceScore: 85,
  riskCategory: "low",
  lastAuditDate: "2025-01-10T09:00:00Z",
};

export const mockReportData: ReportData = {
  reportId: "RPT-001",
  generatedAt: "2025-01-15T08:30:00Z",
  summary: "Quarterly performance summary",
  metrics: {
    alpha: 42.5,
    beta: 78.3,
    gamma: 15.2,
  },
};
```

### 4. Environment-Based Switching (for local testing)

```typescript
// src/lib/config.ts

// @REPLACE-PROD: Remove USE_MOCKS, always use real API in production
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// @REPLACE-PROD: Replace with real API base URL from environment
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://dummyjson.com";
```

```typescript
// src/hooks/useUser.ts

import { mockUser } from "@/components/UserDashboard/UserDashboard.mock";
import { fetchUser } from "@/api/userApi";
import { USE_MOCKS } from "@/lib/config";

export function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (USE_MOCKS) {
      // @REPLACE-PROD: Remove this branch
      setUser(mockUser);
      return;
    }

    fetchUser(id).then(setUser);
  }, [id]);

  return user;
}
```

### 5. Checklist File Convention

Include a `PROD_CHECKLIST.md` in each feature folder:

```markdown
# Production Checklist: UserDashboard

## Files to modify

- [ ] `UserDashboard.types.ts` - Replace confidential interfaces
- [ ] `userApi.ts` - Update endpoints
- [ ] `userAdapter.ts` - Map real field names

## Files to delete

- [ ] `UserDashboard.mock.ts`

## Search for markers

Run: `grep -r "@REPLACE-PROD" ./src/components/UserDashboard`

## Notes

- ReportData interface should match `/api/v2/reports` response
- complianceScore is called `riskScore` in real API
```

---

## Workflow Summary

```
LOCAL DEV                           CLOUD WORKSTATION
───────────────────────────────────────────────────────

1. Create feature branch
   in feature-repo
        │
2. Build with dummy data
   + @REPLACE-PROD markers
        │
3. Test locally with mocks
        │
4. Push to feature-repo
        │
        └──────────────────────►  5. Pull feature-repo
                                        │
                                  6. Copy files to prod-repo
                                        │
                                  7. Search: grep -r "@REPLACE-PROD"
                                        │
                                  8. Replace using OpenAPI specs
                                        │
                                  9. Delete *.mock.ts files
                                        │
                                  10. Test with real API
                                        │
                                  11. Commit to prod-repo
```

---

## Questions for you

1. **Does this convention feel workable?** Too rigid, too loose?

2. **Do you want me to create a starter template** with these conventions set up in a Next.js project?

3. **Would a simple script be helpful** that generates the checklist by scanning for `@REPLACE-PROD` markers?
