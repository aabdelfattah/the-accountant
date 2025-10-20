# The Accountant

A comprehensive accounting system built with Next.js for managing financial transactions, projects, and double-entry bookkeeping.

## Architecture Pattern: Domain-Driven Design (Lite)

We follow a simplified DDD approach organized around accounting domains:

### Core Domains
- **Chart of Accounts**: Account types, categories, and hierarchy
- **Journal Entries**: Double-entry bookkeeping transactions
- **Projects**: Client projects with associated revenues and expenses
- **Revenue & Expense Tracking**: Source transactions that generate journal entries
- **User Management**: Authentication and audit trail

### Folder Structure
```
/app                    # Next.js App Router
  /api                 # API route handlers
  /dashboard           # Protected dashboard pages
/components            # React components
  /ui                  # shadcn/ui primitives
  /dashboard           # Business logic components
/lib                   # Core business logic
  /db.ts              # Database client (Prisma)
  /accounting         # Accounting domain logic (if exists)
/prisma                # Database schema and seed data
/types                 # TypeScript definitions
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB with Prisma ORM
- **Auth**: NextAuth.js
- **UI**: React 19, shadcn/ui, Tailwind CSS
- **Validation**: Zod schemas
- **Accounting Engine**: Medici (referenced via `mediciJournalId`)

## Database Design Philosophy

### Accounting Principles
- **Double-entry bookkeeping**: Every journal entry has balanced debits and credits
- **Immutability**: Journal entries are never deleted, only reversed via reversal entries
- **Audit trail**: Track all changes with timestamps and user references
- **Source tracking**: Revenue/Expense records link to their generated journal entries

### Prisma Schema Structure

#### Key Models
1. **ChartOfAccount**: Chart of accounts with hierarchical structure
   - Self-referential parent/children relationships
   - Tracks current balance
   - Used by JournalEntryLine for account classification

2. **JournalEntry**: Parent record for double-entry transactions
   - Has multiple `JournalEntryLine` records (one-to-many)
   - Links to source (Revenue, Expense, Project)
   - Supports reversal pattern via `reversalId`/`reversedBy`
   - References external Medici journal via `mediciJournalId`

3. **JournalEntryLine**: Individual debits and credits
   - Each line references one account (ChartOfAccount)
   - Has either debitAmount or creditAmount (not both)
   - Multiple lines make up a complete journal entry

4. **Revenue & Expense**: Source transactions
   - Each can link to a JournalEntry (one-to-one via `journalEntryId`)
   - Support multi-currency with exchange rates
   - Track payment status and dates

5. **Project**: Client project container
   - Groups related revenues and expenses
   - Links to journal entries for project-specific accounting

6. **User**: Authentication and ownership
   - Owns projects, revenues, expenses
   - Used for audit trail

### Prisma Conventions
- Use explicit relation names for clarity (e.g., "AccountHierarchy", "Reversal")
- Cascade deletes ONLY for truly dependent data (JournalEntryLine deletes with JournalEntry)
- Use `@map("_id")` for MongoDB ObjectId compatibility
- Use `@map("table_name")` for collection names (snake_case)
- Timestamps: `createdAt`, `updatedAt` on all models
- Soft deletes: Use `reversed: true` for journal entries, `active: false` for accounts/users

## Code Conventions

### Naming
- **Components**: PascalCase (`TransactionForm.tsx`, `AccountSelector.tsx`)
- **Functions**: camelCase (`calculateBalance()`, `createJournalEntry()`)
- **Types/Interfaces**: PascalCase (`AccountWithBalance`, `JournalEntryWithLines`)
- **Database fields**: camelCase matching TypeScript conventions
- **Enums/Constants**: UPPER_SNAKE_CASE or union types

### React Patterns
- **Server Components by default** (Next.js 15 App Router)
- Use `"use client"` directive ONLY when necessary:
  - Forms with user interaction
  - Event handlers (onClick, onChange)
  - React hooks (useState, useEffect)
  - Browser APIs
- Colocate related components
- Extract reusable logic to custom hooks (prefix with `use`)
- Prefer composition over prop drilling

### API Routes (App Router)
- Location: `/app/api/[resource]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Return `NextResponse.json()` for responses
- Use Zod for input validation
- Handle errors with try-catch and return appropriate status codes
- Consistent error format: `{ error: "message" }`

### TypeScript
- Strict mode enabled
- Use Prisma-generated types whenever possible
- Create custom types in `/types` for complex business logic
- Use Zod schemas for runtime validation
- Avoid `any` type

## Accounting Logic Rules

### Journal Entry Creation
**CRITICAL**: Every journal entry MUST:
1. Have at least 2 lines (minimum one debit, one credit)
2. Total debits MUST equal total credits (balanced entry)
3. Each line references a valid ChartOfAccount
4. Only use debitAmount OR creditAmount per line (never both non-zero)
5. Never modify posted journal entries (create reversal instead)

### Account Balance Calculation
- **Assets & Expenses**: Increased by debits, decreased by credits
- **Liabilities, Equity & Income**: Increased by credits, decreased by debits
- Balance = Sum(debits) - Sum(credits) for Asset/Expense accounts
- Balance = Sum(credits) - Sum(debits) for Liability/Equity/Income accounts

### Multi-Currency Handling
- Store original amount and currency
- Store exchangeRate at transaction time
- Store convertedAmount in base currency (USD)
- Never recalculate historical exchange rates

### Reversal Pattern
To reverse a journal entry:
1. Create NEW journal entry with opposite amounts
2. Link via `reversalId` and `reversedBy` relationship
3. Mark original entry as `reversed: true`
4. Never delete the original entry

## Critical DOs and DON'Ts

### ⚠️ CRITICAL DON'Ts - NEVER DO THESE

1. **NEVER modify working code without explicit request**
   - If feature A works, don't touch it while fixing feature B
   - Only modify files directly related to the current task

2. **NEVER refactor multiple files in one change**
   - Make focused, isolated changes
   - One feature/fix per change set
   - If refactoring is needed, ask user first

3. **NEVER delete or modify database schema without confirmation**
   - Schema changes affect all data
   - Always ask before adding/removing fields
   - Never remove fields that might have data

4. **NEVER change accounting logic without validation**
   - Double-entry rules are sacred
   - Changing balance calculations can break entire system
   - Always verify debits = credits after changes

5. **NEVER modify Prisma relations carelessly**
   - Relation changes can break existing queries
   - Cascade deletes can cause data loss
   - Test relation queries after changes

6. **NEVER auto-commit or auto-push code**
   - Always show changes to user first
   - Only commit when explicitly requested
   - Never force push

7. **NEVER modify multiple domains simultaneously**
   - If working on Revenue, don't touch Expense code
   - Keep changes isolated to single domain
   - Reduce blast radius of potential bugs

8. **NEVER add dependencies without asking**
   - New packages increase bundle size
   - May have security implications
   - Check if existing tools can solve the problem

9. **NEVER change environment variable names**
   - Can break deployments
   - May affect multiple environments
   - Coordinate with user first

10. **NEVER modify seed data without confirmation**
    - Seed data might be used in production
    - Chart of accounts is critical foundation
    - Changes affect all test scenarios

### ✅ Critical DOs - ALWAYS DO THESE

1. **ALWAYS read existing code before modifying**
   - Understand current implementation
   - Follow existing patterns
   - Don't introduce inconsistencies

2. **ALWAYS validate journal entries balance**
   - Sum all debits = Sum all credits
   - Check before saving to database
   - Return clear error if unbalanced

3. **ALWAYS preserve audit trail**
   - Never delete financial records
   - Use reversal pattern for corrections
   - Keep createdAt, updatedAt timestamps

4. **ALWAYS use Prisma for database operations**
   - Don't write raw MongoDB queries
   - Leverage type safety
   - Use Prisma relations properly

5. **ALWAYS handle errors gracefully**
   - Try-catch around database operations
   - Return meaningful error messages
   - Log errors for debugging

6. **ALWAYS ask before major changes**
   - Schema modifications
   - Large refactors
   - New architectural patterns
   - Dependency additions

7. **ALWAYS make focused, isolated changes**
   - Fix one thing at a time
   - Keep changes small and reviewable
   - Single responsibility per PR/commit

8. **ALWAYS test accounting calculations**
   - Verify balance calculations
   - Test edge cases (zero amounts, large numbers)
   - Validate currency conversions

9. **ALWAYS use TypeScript types**
   - Leverage Prisma-generated types
   - Create types for API responses
   - Avoid any type

10. **ALWAYS respect the double-entry principle**
    - Every transaction has equal debits and credits
    - Account types matter (Asset, Liability, etc.)
    - Never create unbalanced entries

## Change Management Protocol

When making changes, follow this process:

1. **Understand** - Read existing code and related files
2. **Plan** - Outline what needs to change (use TodoWrite)
3. **Isolate** - Identify minimal set of files to modify
4. **Implement** - Make focused changes to those files only
5. **Validate** - Check that change works and nothing else broke
6. **Communicate** - Show user what changed and why

### Before Any Modification
Ask yourself:
- [ ] Is this change requested or necessary?
- [ ] Do I understand the current implementation?
- [ ] Can I make this change without touching working features?
- [ ] Will this affect other parts of the system?
- [ ] Do I need to ask the user first?

## Common Patterns

### Creating a Journal Entry from Revenue
```typescript
// 1. Create revenue record
const revenue = await prisma.revenue.create({ ... })

// 2. Create journal entry
const journalEntry = await prisma.journalEntry.create({
  data: {
    date: revenue.revenueDate,
    description: revenue.description,
    source: "REVENUE",
    lines: {
      create: [
        // Debit: Bank/Receivable
        { accountId: bankAccountId, debitAmount: revenue.amount, creditAmount: 0 },
        // Credit: Revenue Account
        { accountId: revenueAccountId, debitAmount: 0, creditAmount: revenue.amount },
      ]
    }
  }
})

// 3. Link them
await prisma.revenue.update({
  where: { id: revenue.id },
  data: { journalEntryId: journalEntry.id }
})
```

### Querying Journal Entries with Lines
```typescript
const entries = await prisma.journalEntry.findMany({
  include: {
    lines: {
      include: {
        account: true  // Include account details
      }
    },
    project: true,  // Include related project if exists
  },
  where: {
    reversed: false  // Only non-reversed entries
  }
})
```

### Calculating Account Balance
```typescript
const lines = await prisma.journalEntryLine.findMany({
  where: { accountId: accountId },
  include: { account: true }
})

const balance = lines.reduce((sum, line) => {
  if (account.type === 'ASSET' || account.type === 'EXPENSE') {
    return sum + line.debitAmount - line.creditAmount
  } else {
    return sum + line.creditAmount - line.debitAmount
  }
}, 0)
```

## Known Constraints & Gotchas

### MongoDB + Prisma Limitations
- No JOIN operations (use `include` for relations)
- No database-level transactions across collections (consider PostgreSQL if needed)
- Replica set required for multi-document transactions
- ObjectId format required for all IDs

### Medici Integration
- External journal entries stored in Medici
- We reference via `mediciJournalId` field
- Keep our JournalEntry as authoritative source of truth
- Medici used for complex queries/reporting (if implemented)

### Floating Point Precision
- Currently using Float for amounts (not ideal for money)
- **TODO**: Consider migrating to Decimal or storing in cents (Int)
- Be careful with calculations involving money
- Round appropriately for display

### Chart of Accounts Hierarchy
- Self-referential relation with `parentId`
- Can create unlimited depth
- Be careful with circular references
- `onDelete: NoAction` prevents accidental cascade

## Testing Strategy

- **Unit tests**: Accounting calculations (balance, validation)
- **Integration tests**: API routes with database operations
- **E2E tests**: Critical user flows (creating entries, posting transactions)
- Test unbalanced entries are rejected
- Test reversal pattern works correctly

## Environment Variables

Required in `.env`:
```
DATABASE_URL="mongodb://..."           # MongoDB connection string
NEXTAUTH_SECRET="..."                  # Auth encryption key (min 32 chars)
NEXTAUTH_URL="http://localhost:3000"   # Application URL
```

## When to Ask User

Always ask before:
- Modifying Prisma schema
- Adding new npm packages
- Changing accounting logic
- Large refactors (>3 files)
- Changing API contracts
- Modifying authentication
- Database migrations
- Changing environment variables

## Remember

> "First, do no harm" - Make surgical, focused changes. Don't fix what isn't broken. Keep changes isolated and reversible. When in doubt, ask the user.
