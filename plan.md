# The Accountant - Implementation Plan & Progress

## Project Overview

A modern accounting management system for project-based businesses with:

- Double-entry bookkeeping
- Multi-currency support
- Role-based access control (Admin, Accountant, User)
- Comprehensive financial reporting

## Technology Stack

- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: MongoDB Atlas with Prisma ORM + Mongoose
- **Accounting Engine**: Medici (double-entry bookkeeping library)
- **Authentication**: NextAuth.js v5
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: React Context + Zustand
- **Deployment**: Railway (App) + MongoDB Atlas (Database)

---

## Implementation Progress

### ✅ Phase 1: Project Setup & Infrastructure (COMPLETED)

**Development:**

- [x] Initialize Next.js project with TypeScript
- [x] Setup MongoDB Atlas database configuration
- [x] Configure Prisma ORM with MongoDB-compatible schema
- [x] Install and configure UI libraries (shadcn/ui, Tailwind CSS)
- [x] Create accounts.json with complete chart of accounts (72 accounts)
- [x] Create seed script to populate database
- [x] Migrate from PostgreSQL to MongoDB for Medici compatibility
- [x] Install Medici (v7.2.0) and Mongoose (v8.19.1) packages
- [x] Fix MongoDB connection string handling for Railway

**Testing:**

- [x] Verify `npm install` completes successfully
- [x] Verify `npm run build` compiles without errors
- [x] Test database connection (local MongoDB + Atlas)
- [x] Test seed script execution (72 accounts + 3 users created)
- [x] Verify production deployment on Railway
- [x] Test production database seeding on Atlas

**Files Created:**

- Configuration files (package.json, tsconfig.json, tailwind.config.ts, etc.)
- prisma/schema.prisma (MongoDB), prisma/schema-postgres-backup.prisma
- prisma/seed.ts, accounts.json
- lib/prisma.ts (with MongoDB URL fix), lib/utils.ts
- README.md (updated for MongoDB), .env.example

---

### ✅ Phase 2: Authentication & User Management (COMPLETED)

**Development:**

- [x] Implement NextAuth.js v5 authentication
- [x] Create login/logout functionality
- [x] Setup role-based access control
- [x] Protected routes middleware
- [x] Login page with form validation

**Testing:**

- [x] Build check: `npm run build` (no TypeScript errors)
- [x] Test login on production (admin@transverse.me)
- [x] Test protected route redirection
- [x] Verify role-based access control works

**Files Created:**

- auth.config.ts, auth.ts, middleware.ts
- app/api/auth/[...nextauth]/route.ts
- app/login/page.tsx, components/auth/login-form.tsx

**Default Users (after seeding):**

- Admin: admin@transverse.me / admin123
- Accountant: accountant@transverse.me / accountant123
- User: user@transverse.me / user123

---

### ✅ Phase 3: Dashboard & Navigation (COMPLETED)

**Development:**

- [x] Create dashboard layout with sidebar
- [x] Implement role-based navigation
- [x] User profile dropdown
- [x] Dashboard home page with quick links

**Testing:**

- [x] `npm run build` - verify no errors
- [x] Test dashboard loads in production
- [x] Verify navigation is visible and functional
- [ ] **TODO**: Test navigation visibility for each role
- [ ] **TODO**: Test responsive design on mobile

**Files Created:**

- app/dashboard/layout.tsx, app/dashboard/page.tsx
- components/dashboard/nav.tsx, components/dashboard/user-nav.tsx

---

### ✅ Phase 3.5: Production Deployment (COMPLETED)

**Development:**

- [x] Deploy application to Railway
- [x] Configure MongoDB Atlas (M0 Free Tier)
- [x] Set up environment variables in Railway
- [x] Fix AUTH_TRUST_HOST for NextAuth production
- [x] Handle Railway MongoDB space limitations
- [x] Configure DATABASE_URL with Atlas connection string
- [x] Deploy and verify application is live

**Testing:**

- [x] Test production database connection
- [x] Push Prisma schema to Atlas
- [x] Seed production database successfully
- [x] Test production login at the-accountant-production.up.railway.app
- [x] Verify all environment variables are set correctly
- [x] Check application logs for errors

**Production Info:**

- **URL**: https://the-accountant-production.up.railway.app
- **Database**: MongoDB Atlas (M0 Free - 512MB)
- **Deployment Platform**: Railway
- **Status**: ✅ Live and Working

---

### ✅ Phase 4: Medici Integration (COMPLETED)

**Priority: CRITICAL** (Foundation for Double-Entry Accounting)

Medici is a Node.js library that provides a simple interface for double-entry accounting. It handles:

- Creating journal entries with debits and credits
- Maintaining account balances
- Querying transaction history
- Balance verification

**Development Tasks:**

- [x] Set up unified database connection manager (Prisma + Mongoose)
- [x] Create Medici book wrapper with helper functions
- [x] Build Medici service layer integrated with Chart of Accounts
- [x] Implement createEntry(), getBalance(), getLedger() API
- [x] Test journal entry creation and balance queries
- [x] Verify build succeeds without errors

**Testing Results:**

- [x] Mongoose connects successfully to MongoDB
- [x] Journal entries created correctly (tested with $1000 Cash → Revenue)
- [x] Account balances query working (Cash: -1000, Revenue: 1000)
- [x] No TypeScript compilation errors
- [x] Next.js build successful

**Files Created:**

- `lib/db.ts` - Unified database connection manager
- `lib/medici/book.ts` - Medici book and journal entry helpers
- `lib/medici/service.ts` - Service layer with Chart of Accounts integration
- `lib/medici/index.ts` - Clean export API

**Time Spent:** ~2.5 hours

---

## 🔨 Remaining Work

### Phase 5: Chart of Accounts Infrastructure (CRITICAL - FOUNDATIONAL)

**Priority: CRITICAL** (Must be completed BEFORE revenue/expense recording)

Based on the Transverse Accounting Rules document, we need dynamic account creation to support:

- Project-specific accounts
- Freelancer-specific accounts
- Founder loan accounts
- Client-specific accounts

**Development Tasks:**

#### 5.1 Dynamic Account Creation System

- [ ] Create account template system for auto-generating accounts
- [ ] Implement account numbering strategy (e.g., 4000-4999 for project revenues)
- [ ] Build account creation API with validation
- [ ] Prevent duplicate account codes
- [ ] Support account hierarchies (parent-child relationships)

#### 5.2 Project-Linked Accounts

- [ ] Auto-create project revenue account when project is created (Code: 4xxx)
- [ ] Auto-create project COGS account for freelancer costs (Code: 5xxx)
- [ ] Link accounts to project entity
- [ ] Archive project accounts when project is archived

#### 5.3 Freelancer/Vendor Accounts

- [ ] Create freelancer master entity (name, email, payment terms)
- [ ] Auto-create "Accounts Payable - [Freelancer Name]" sub-account (Code: 2001-2099)
- [ ] Auto-create "Freelancer Expense - [Name]" account (Code: 5001-5099)
- [ ] Track freelancer payment history

#### 5.4 Founder Loan Accounts

- [ ] Create "Founder Payable - Ahmed" account (Code: 2401)
- [ ] Support multiple founders if needed
- [ ] Track founder capital contributions vs. loans
- [ ] Enable reimbursement tracking

#### 5.5 Client-Specific Accounts (Optional but Recommended)

- [ ] Create client master entity
- [ ] Auto-create "Accounts Receivable - [Client Name]" sub-account (Code: 1101-1199)
- [ ] Link invoices to specific client AR accounts
- [ ] Track aging per client

#### 5.6 System Accounts Required by Accounting Rules

Ensure these accounts exist in seed data:

- [ ] 1100 - Accounts Receivable (parent)
- [ ] 1200 - Unbilled Receivable
- [ ] 1300 - Prepaid Expenses
- [ ] 2000 - Accounts Payable (parent)
- [ ] 2200 - Taxes Payable
- [ ] 2300 - Deferred Revenue
- [ ] 2400 - Founder Loans (parent)
- [ ] 5400 - Transaction Fee Expense (PayPal, etc.)
- [ ] 5503 - Bad Debt Expense

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test account creation with validation
- [ ] Test automatic account numbering (no duplicates)
- [ ] Test project account auto-creation
- [ ] Test freelancer account auto-creation
- [ ] Test account hierarchy (parent-child)
- [ ] Test preventing deletion of accounts with transactions
- [ ] Write unit tests for account creation logic
- [ ] Integration test: Create project → Verify accounts created

**Estimated Time:** 8-10 hours (including tests)

**Files to Create:**

- `lib/accounting/account-templates.ts` - Account creation templates
- `lib/accounting/account-manager.ts` - Dynamic account creation logic
- `app/api/accounts/route.ts` - Account CRUD API
- `app/api/accounts/[id]/route.ts` - Single account operations
- `app/dashboard/accounts/page.tsx` - Enhanced UI for account management
- `components/accounts/account-form.tsx` - Create/edit account form
- `components/accounts/account-hierarchy.tsx` - Tree view of accounts
- `lib/entities/freelancer.ts` - Freelancer entity management
- `lib/entities/client.ts` - Client entity management
- `__tests__/lib/account-manager.test.ts`
- `__tests__/api/accounts.test.ts`

**Database Schema Updates:**

```prisma
// Add to schema.prisma

model Freelancer {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  email       String?  @unique
  phoneNumber String?
  paymentTerms String? // e.g., "NET30", "Upon completion"
  active      Boolean  @default(true)

  // Linked accounts
  payableAccountId String? @db.ObjectId
  expenseAccountId String? @db.ObjectId

  expenses    Expense[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("freelancers")
}

model Client {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  email       String?
  phoneNumber String?
  billingAddress String?
  paymentTerms String?
  active      Boolean  @default(true)

  // Linked account
  receivableAccountId String? @db.ObjectId

  projects    Project[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("clients")
}

// Update Project model to link to Client
model Project {
  // ... existing fields
  clientId    String?  @db.ObjectId
  client      Client?  @relation(fields: [clientId], references: [id])

  // Linked accounts
  revenueAccountId String? @db.ObjectId
  cogsAccountId    String? @db.ObjectId
}

// Update ChartOfAccount to track account source
model ChartOfAccount {
  // ... existing fields

  // Track what created this account
  linkedEntityType String? // "PROJECT", "FREELANCER", "CLIENT", "FOUNDER"
  linkedEntityId   String? @db.ObjectId

  // Account numbering metadata
  autoGenerated Boolean @default(false)

  @@index([linkedEntityType, linkedEntityId])
}
```

**Why This is Critical:**

According to the accounting rules document:

1. **Each project needs its own revenue account** (Rule 1-3)
2. **Each freelancer needs payable and expense accounts** (Rule 6-7)
3. **Founders need loan/payable accounts** (Rule 11-12)
4. **Without these accounts, we cannot record transactions correctly**

This infrastructure must exist BEFORE we can implement revenue and expense recording.

---

### Phase 6: Admin Panel (User Management)

**Priority: HIGH**

**Development Tasks:**

- [ ] Create user management page
- [ ] List all users with role badges
- [ ] Add new user form with validation
- [ ] Edit user details
- [ ] Deactivate/activate users
- [ ] Role assignment

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test CRUD operations for users
- [ ] Test role-based access (only admin can access)
- [ ] Test form validation (email, password strength)
- [ ] Test user activation/deactivation
- [ ] Write unit tests for user API endpoints

**Estimated Time:** 3-4 hours (including tests)

**Files to Create:**

- `app/dashboard/admin/users/page.tsx`
- `components/admin/user-list.tsx`
- `components/admin/user-form.tsx`
- `app/api/users/route.ts`
- `__tests__/api/users.test.ts`

---

### Phase 6: Chart of Accounts Management

**Priority: HIGH** (Accountant Feature)

**Development Tasks:**

- [ ] Display chart of accounts in hierarchical table
- [ ] Add new accounts with parent selection
- [ ] Edit account details
- [ ] Deactivate accounts (prevent deletion of accounts with transactions)
- [ ] Show current balance for each account
- [ ] Search and filter functionality

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test account creation with parent relationships
- [ ] Test account hierarchy display
- [ ] Test prevention of system account deletion
- [ ] Test balance calculations
- [ ] Write unit tests for account validation logic
- [ ] Test role-based access

**Estimated Time:** 4-5 hours (including tests)

**Files to Create:**

- `app/dashboard/accounts/page.tsx`
- `components/accounts/accounts-table.tsx`
- `components/accounts/account-form.tsx`
- `app/api/accounts/route.ts`
- `lib/accounting/account-validator.ts`
- `__tests__/lib/account-validator.test.ts`

---

### Phase 7: Chart of Accounts UI & Management

**Priority: HIGH** (Accountant Feature)

**Dependencies:** Phase 5 (Account Infrastructure)

---

### Phase 8: Projects Module

**Priority: HIGH** (Core Feature)

**Dependencies:** Phase 5 (Account Infrastructure - projects need linked accounts)

**Development Tasks:**

- [ ] List all projects with status filters
- [ ] Create new project with validation
- [ ] Edit project details
- [ ] Archive projects
- [ ] Project detail page showing revenues and expenses
- [ ] Project profitability summary

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test project CRUD operations
- [ ] Test project filtering and search
- [ ] Test project-user association
- [ ] Test project archiving (ensure revenues/expenses remain)
- [ ] Write unit tests for project API
- [ ] Test profitability calculations

**Estimated Time:** 5-6 hours (including tests)

**Files to Create:**

- `app/dashboard/projects/page.tsx`
- `app/dashboard/projects/[id]/page.tsx`
- `components/projects/project-list.tsx`
- `components/projects/project-form.tsx`
- `app/api/projects/route.ts`
- `__tests__/api/projects.test.ts`

---

### Phase 9: Revenue Entry

**Priority: HIGH** (Core Feature)

**Dependencies:** Phase 5 (Account Infrastructure), Phase 8 (Projects with linked accounts)

**Development Tasks:**

- [ ] Revenue entry form with validation
- [ ] Link to project (dropdown)
- [ ] Multi-currency support with exchange rate
- [ ] Payment status tracking (Unbilled → Pending → Paid)
- [ ] Bank account selection
- [ ] Tax and withholding fields
- [ ] List all revenues with filters
- [ ] Edit/delete revenue entries

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test revenue creation and validation
- [ ] Test currency conversion calculations
- [ ] Test payment status transitions
- [ ] Test revenue-project linkage
- [ ] Write unit tests for revenue validation
- [ ] Test edge cases (negative amounts, future dates, etc.)
- [ ] Integration test: Create revenue → Verify journal entry

**Estimated Time:** 5-6 hours (including tests)

**Files to Create:**

- `app/dashboard/revenues/page.tsx`
- `app/dashboard/revenues/new/page.tsx`
- `components/revenues/revenue-form.tsx`
- `components/revenues/revenue-list.tsx`
- `app/api/revenues/route.ts`
- `lib/validators/revenue-validator.ts`
- `__tests__/api/revenues.test.ts`
- `__tests__/lib/revenue-validator.test.ts`

---

### Phase 10: Expense Entry

**Priority: HIGH** (Core Feature)

**Dependencies:** Phase 5 (Account Infrastructure - freelancer accounts), Phase 8 (Projects)

**Development Tasks:**

- [ ] Expense entry form with validation
- [ ] Category selection (COGS vs Operating Expenses)
- [ ] Link to project (for COGS expenses)
- [ ] Link to specific account (freelancer, subscription)
- [ ] Multi-currency support
- [ ] Payment status tracking
- [ ] Recurring expense support (for subscriptions)
- [ ] List all expenses with filters
- [ ] Edit/delete expense entries

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test expense creation for all categories
- [ ] Test project-linked expenses (COGS)
- [ ] Test non-project expenses
- [ ] Test recurring expense creation
- [ ] Test currency conversion
- [ ] Write unit tests for expense validation
- [ ] Integration test: Create expense → Verify journal entry

**Estimated Time:** 5-6 hours (including tests)

**Files to Create:**

- `app/dashboard/expenses/page.tsx`
- `app/dashboard/expenses/new/page.tsx`
- `components/expenses/expense-form.tsx`
- `components/expenses/expense-list.tsx`
- `app/api/expenses/route.ts`
- `lib/validators/expense-validator.ts`
- `__tests__/api/expenses.test.ts`
- `__tests__/lib/expense-validator.test.ts`

---

### Phase 11: Accounting Engine (Transaction Processing)

**Priority: CRITICAL** (Core Logic)

**Dependencies:** Phase 5 (Account Infrastructure), Phase 9 (Revenue), Phase 10 (Expense)

This is the heart of the system - automatically generates journal entries from user transactions.

**Development Tasks:**

#### Revenue Recognition Logic

- [ ] Unbilled Revenue: DR Unbilled Receivable (1200), CR Project Revenue (4xxx)
- [ ] Invoice Issued: DR Accounts Receivable (1100), CR Unbilled Receivable (1200)
- [ ] Payment Received: DR Cash/Bank (1001/1002), CR Accounts Receivable (1100)
- [ ] Currency Gain/Loss calculation and recording

#### Expense Recognition Logic

- [ ] COGS (Freelancer): DR Cost of Sales (5001), CR Accounts Payable (2001)
- [ ] Expense Payment: DR Accounts Payable (2000), CR Cash/Bank (1001/1002)
- [ ] Direct Expenses: DR Expense Account (5xxx), CR Cash/Bank (1001/1002)
- [ ] Prepaid Expenses: DR Prepaid Expenses (1300), CR Cash/Bank
- [ ] Currency Loss calculation and recording

#### Core Functions

- [ ] Transaction processor service
- [ ] Journal entry generator
- [ ] Account balance updater
- [ ] Transaction validator (double-entry balance check)
- [ ] Reversal entry generator (for corrections)

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] **Unit Tests** for each accounting rule:
  - [ ] Test revenue unbilled → pending → paid transitions
  - [ ] Test expense COGS journal entries
  - [ ] Test expense operating journal entries
  - [ ] Test currency gain/loss calculations
  - [ ] Test double-entry balance (debits = credits)
  - [ ] Test account balance updates
- [ ] **Integration Tests**:
  - [ ] Create revenue → Verify correct journal entries created
  - [ ] Update revenue status → Verify additional entries
  - [ ] Create expense → Verify journal entries
  - [ ] Delete transaction → Verify reversal entry
- [ ] **Edge Case Tests**:
  - [ ] Test with $0 amounts
  - [ ] Test with very large amounts
  - [ ] Test multiple currencies
  - [ ] Test same-day transactions

**Estimated Time:** 8-10 hours (including comprehensive tests)

**Files to Create:**

- `lib/accounting/transaction-processor.ts`
- `lib/accounting/revenue-rules.ts`
- `lib/accounting/expense-rules.ts`
- `lib/accounting/journal-generator.ts`
- `lib/accounting/balance-updater.ts`
- `lib/accounting/validators.ts`
- `__tests__/lib/accounting/revenue-rules.test.ts`
- `__tests__/lib/accounting/expense-rules.test.ts`
- `__tests__/lib/accounting/journal-generator.test.ts`
- `__tests__/lib/accounting/transaction-processor.test.ts`
- `__tests__/integration/accounting-flow.test.ts`

---

### Phase 12: Journal Entries UI

**Priority: MEDIUM** (Accountant Feature)

**Dependencies:** Phase 11 (Accounting Engine - journal entries must exist)

**Development Tasks:**

- [ ] Display all journal entries in table format
- [ ] Filter by date range, source, account
- [ ] Show debits and credits for each entry
- [ ] Drill down into entry details
- [ ] Export to Excel/CSV
- [ ] Manual journal entry creation (for adjustments)
- [ ] Entry reversal functionality

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test journal entry list pagination
- [ ] Test filtering and search
- [ ] Test manual entry creation
- [ ] Test entry reversal
- [ ] Test export functionality
- [ ] Verify double-entry balance in UI
- [ ] Test role-based access (accountant/admin only)

**Estimated Time:** 5-6 hours (including tests)

**Files to Create:**

- `app/dashboard/journal/page.tsx`
- `components/journal/journal-table.tsx`
- `components/journal/entry-detail.tsx`
- `components/journal/manual-entry-form.tsx`
- `app/api/journal/route.ts`
- `lib/export/excel-generator.ts`
- `__tests__/api/journal.test.ts`

---

### Phase 13: Financial Reports

**Priority: MEDIUM** (Accountant Feature)

**Dependencies:** Phase 11 (Accounting Engine - need complete transaction data)

**Development Tasks:**

#### Income Statement (P&L)

- [ ] Revenue breakdown by type
- [ ] COGS breakdown
- [ ] Operating expenses breakdown
- [ ] Net profit calculation
- [ ] Period selection (monthly, quarterly, yearly)
- [ ] Comparison with previous periods

#### Balance Sheet

- [ ] Assets (Current, Fixed)
- [ ] Liabilities (Current, Long-term)
- [ ] Equity
- [ ] Balance verification (Assets = Liabilities + Equity)

#### Other Reports

- [ ] Trial Balance
- [ ] Cash Flow Statement
- [ ] Project Profitability Report
- [ ] Export all reports to PDF/Excel

**Testing Tasks:**

- [ ] `npm run build` - verify compilation
- [ ] Test income statement calculations
- [ ] Test balance sheet balance (A = L + E)
- [ ] Test trial balance (debits = credits)
- [ ] Test period filtering
- [ ] Test report exports
- [ ] Write unit tests for report calculations
- [ ] Test with sample data across multiple periods
- [ ] Verify calculations against manual accounting

**Estimated Time:** 7-9 hours (including tests)

**Files to Create:**

- `app/dashboard/reports/page.tsx`
- `app/dashboard/reports/income-statement/page.tsx`
- `app/dashboard/reports/balance-sheet/page.tsx`
- `components/reports/income-statement.tsx`
- `components/reports/balance-sheet.tsx`
- `lib/reports/income-statement-generator.ts`
- `lib/reports/balance-sheet-generator.ts`
- `lib/reports/trial-balance-generator.ts`
- `__tests__/lib/reports/income-statement.test.ts`
- `__tests__/lib/reports/balance-sheet.test.ts`

---

### Phase 14: End-to-End Testing & Refinement

**Priority: MEDIUM**

**Testing Tasks:**

- [ ] Setup testing framework (Jest + React Testing Library)
- [ ] E2E tests for critical user flows:
  - [ ] Login as each role
  - [ ] Create project → Add revenue → Verify journal
  - [ ] Create expense → Verify journal
  - [ ] Generate income statement
  - [ ] Admin creates user
- [ ] Performance testing:
  - [ ] Test with 1000+ transactions
  - [ ] Test report generation speed
  - [ ] Database query optimization
- [ ] Security audit:
  - [ ] SQL injection prevention (Prisma handles this)
  - [ ] XSS prevention
  - [ ] CSRF protection
  - [ ] Role-based access enforcement
- [ ] Error handling and validation:
  - [ ] Test error messages
  - [ ] Test form validation
  - [ ] Test API error responses
- [ ] Build verification:
  - [ ] `npm run build` - production build
  - [ ] `npm run lint` - code quality
  - [ ] Run full test suite
  - [ ] Check bundle size

**Estimated Time:** 5-7 hours

**Files to Create:**

- `jest.config.js`
- `__tests__/e2e/user-flow.test.ts`
- `__tests__/e2e/accounting-flow.test.ts`
- `__tests__/performance/reports.test.ts`

---

### Phase 15: Documentation & Production Hardening

**Priority: LOW**

**Development Tasks:**

- [x] Setup production database (MongoDB Atlas)
- [x] Configure environment variables for production
- [x] Deploy to Railway
- [ ] Setup automatic backups
- [ ] Configure monitoring and logging
- [ ] Add error tracking (Sentry)

**Documentation Tasks:**

- [ ] User guide (PDF/video)
- [ ] Admin guide
- [ ] Accounting procedures documentation
- [ ] API documentation
- [ ] Contributing guide

**Estimated Time:** 3-4 hours

---

## Testing Strategy Summary

### Build & Compile Testing (Every Phase)

```bash
npm run build
npm run lint
```

### Unit Testing

- Test individual functions and components
- Test business logic in isolation
- Use Jest for JavaScript/TypeScript functions

### Integration Testing

- Test API endpoints
- Test database operations
- Test component interactions

### E2E Testing

- Test complete user workflows
- Test across multiple pages
- Simulate real user behavior

### Manual Testing Checklist

- Test on different browsers (Chrome, Firefox, Safari)
- Test responsive design (mobile, tablet, desktop)
- Test with different user roles
- Test edge cases and error scenarios

---

## Timeline Estimate

- **Completed**: ~20.5 hours (Phases 1-4)
  - Phase 1: Project Setup & MongoDB Migration - 6 hours
  - Phase 2: Authentication - 4 hours
  - Phase 3: Dashboard - 3 hours
  - Phase 3.5: Production Deployment - 5 hours
  - Phase 4: Medici Integration - 2.5 hours ✅
- **Remaining**: ~40-50 hours (Phases 5-14, including testing)
- **Total Project**: ~60-70 hours

## Priority Order for Next Steps

### 🚨 Critical Path (Must Follow This Order)

1. **✅ Medici Integration** (Phase 4) - COMPLETED
2. **🔴 Chart of Accounts Infrastructure** (Phase 5) - **NEXT - FOUNDATIONAL**
   - MUST be done first - creates the account framework
   - Enables dynamic account creation for projects, freelancers, clients
   - Without this, we cannot record any transactions
3. **Projects Module** (Phase 8) - Creates project-linked accounts
4. **Chart of Accounts UI** (Phase 7) - View and manage accounts
5. **Revenue Entry** (Phase 9) - Record income (uses project accounts)
6. **Expense Entry** (Phase 10) - Record costs (uses freelancer accounts)
7. **Accounting Engine** (Phase 11) - Auto-generate journal entries
8. **Journal Entries UI** (Phase 12) - View accounting transactions
9. **Financial Reports** (Phase 13) - P&L, Balance Sheet, etc.

### Lower Priority

10. **Admin Panel** (Phase 6) - User management
11. **E2E Testing** (Phase 14) - Quality assurance
12. **Documentation** (Phase 15) - Final polish

### Why Phase 5 is Critical First

Based on the Transverse Accounting Rules document:

- **Rule 1-3**: Project revenue flows through project-specific revenue accounts (4xxx)
- **Rule 6-7**: Freelancer expenses need freelancer-specific payable (2xxx) and expense (5xxx) accounts
- **Rule 11-12**: Founder expenses need founder payable accounts (2401)

**Without Phase 5 infrastructure:**

- ❌ Cannot create projects (need revenue account)
- ❌ Cannot record revenue (need unbilled receivable, AR accounts)
- ❌ Cannot pay freelancers (need AP accounts)
- ❌ Cannot track founder loans (need payable accounts)

**With Phase 5 complete:**

- ✅ Projects auto-create linked revenue/COGS accounts
- ✅ Freelancers auto-create linked payable/expense accounts
- ✅ System has all required accounts per accounting rules
- ✅ Ready to record transactions correctly

---

## Database Setup Instructions

### Local Development

1. Install MongoDB with replica set:

```bash
# macOS
brew install mongodb-community
mongod --replSet rs0 --dbpath /path/to/data

# In another terminal, initialize replica set
mongosh --eval "rs.initiate()"
```

2. Update `.env` file with your database URL:

```
DATABASE_URL="mongodb://localhost:27017/accountant?replicaSet=rs0"
```

3. Push the schema and seed:

```bash
npm run db:push
npm run db:seed
```

4. Verify with Prisma Studio:

```bash
npm run db:studio
```

### Production (MongoDB Atlas)

1. Create free M0 cluster at https://www.mongodb.com/cloud/atlas
2. Configure database access and network access
3. Get connection string with `/accountant` database name
4. Update Railway environment variables
5. Deploy and seed production database

---

## Development Workflow

1. **Before starting a phase:**
   - Review the tasks
   - Estimate time
   - Plan file structure

2. **During development:**
   - Write code
   - Add TypeScript types
   - Add comments for complex logic

3. **After development (CRITICAL):**
   - Run `npm run build` - fix any errors
   - Run `npm run lint` - fix warnings
   - Write unit tests
   - Write integration tests if needed
   - Manual testing
   - Document any issues

4. **Before moving to next phase:**
   - All tests passing
   - No build errors
   - Update this plan.md with progress

---

## Notes

- The schema uses a unified `Expense` model for both COGS and operating expenses
- All transactions automatically generate journal entries
- Currency conversion tracked with gain/loss accounts
- System accounts cannot be deleted to maintain integrity
- Each phase includes dedicated testing time
- Build verification required before moving to next phase
