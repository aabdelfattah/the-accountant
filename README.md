# The Accountant

A modern accounting management system designed for project-based businesses with double-entry bookkeeping, multi-currency support, and comprehensive financial reporting.

## 🎯 Current Status

**Build Status:** ✅ PASSING
**Phase Completed:** 1-3 (Infrastructure, Authentication, Dashboard)
**Ready For:** Database setup and feature development

See [plan.md](./plan.md) for the complete implementation roadmap.

## Features

- **User Management**: Role-based access control (Admin, Accountant, User)
- **Double-Entry Bookkeeping**: Automatic journal entries for all transactions
- **Project Tracking**: Link revenues and expenses to specific projects
- **Multi-Currency Support**: Automatic currency conversion with gain/loss tracking
- **Chart of Accounts**: Comprehensive account hierarchy based on standard accounting practices
- **Financial Reporting**: Income statements, balance sheets, and custom reports
- **Real-time Updates**: Dashboards update automatically when transactions are posted

## Tech Stack

- **Frontend & Backend**: Next.js 14+ (App Router) with TypeScript
- **Database**: MongoDB with Prisma ORM + Mongoose
- **Accounting Engine**: Medici (double-entry bookkeeping)
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: React Context + Zustand

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6+ with Replica Set enabled

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd the-accountant
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
DATABASE_URL="mongodb://localhost:27017/accountant?replicaSet=rs0"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-new-one"
```

**Important**: MongoDB must be running with replica set enabled. To set up a local replica set:

```bash
# Start MongoDB with replica set
mongod --replSet rs0 --dbpath /path/to/data

# In another terminal, initialize the replica set
mongosh --eval "rs.initiate()"
```

To generate a secure secret for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. Set up your chart of accounts:

```bash
# Copy the example file and customize it
cp accounts.json.example accounts.json
# Edit accounts.json with your specific chart of accounts
```

5. Set up the database:

```bash
# Push the schema to database
npm run db:push

# Initialize database indexes (sparse unique indexes for journal entries)
npm run db:init

# Seed with initial data (chart of accounts and demo users)
npm run db:seed
```

**Note:** The `db:init` command creates sparse unique indexes that Prisma doesn't support natively. See [scripts/README.md](./scripts/README.md) for details.

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Users

After seeding, you can log in with these accounts:

- **Admin**: admin@transverse.me / admin123
- **Accountant**: accountant@transverse.me / accountant123
- **User**: user@transverse.me / user123

## User Roles

### Admin

- Full system access
- User management (add/remove users, assign roles)
- Access to all features

### Accountant

- View and manage chart of accounts
- Review all journal entries
- Generate financial reports (Income Statement, Balance Sheet)
- View all transactions across all projects

### User

- Create and manage projects
- Add revenue entries for projects
- Record expenses (freelancers, subscriptions, etc.)
- View own projects and transactions

## Project Structure

```
the-accountant/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── accounts.json         # Chart of accounts configuration
└── package.json
```

## Database Schema

### Key Models

- **User**: Authentication and authorization
- **ChartOfAccount**: Chart of accounts with hierarchy
- **Project**: Project tracking
- **Revenue**: Revenue recognition with multi-currency support
- **Expense**: Both project (COGS) and non-project expenses
- **JournalEntry**: Double-entry journal entries
- **JournalEntryLine**: Individual debit/credit lines

## Accounting Logic

The system uses double-entry bookkeeping. All user transactions automatically generate journal entries:

### Revenue Recognition

1. **Unbilled Revenue**:
   - DR: Unbilled Receivable (1200)
   - CR: Project Revenue (4xxx)

2. **Invoice Issued**:
   - DR: Accounts Receivable (1100)
   - CR: Unbilled Receivable (1200)

3. **Payment Received**:
   - DR: Cash/Bank (1001/1002)
   - CR: Accounts Receivable (1100)

### Expense Recognition

1. **Freelancer Invoice (COGS)**:
   - DR: Cost of Sales (5000)
   - CR: Accounts Payable (2000)

2. **Payment Made**:
   - DR: Accounts Payable (2000)
   - CR: Cash/Bank (1001/1002)

3. **Subscription Expense**:
   - DR: Software & Subscriptions (5100)
   - CR: Cash/Bank (1001/1002)

## Development

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Initialize database indexes (run after db:push or on new environments)
npm run db:init

# Open Prisma Studio (database GUI)
npm run db:studio

# Re-seed database
npm run db:seed
```

### Code Quality

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Chart of Accounts

The system includes a comprehensive chart of accounts (see `accounts.json`):

- **1000-1999**: Assets
- **2000-2999**: Liabilities
- **3000-3999**: Equity
- **4000-4999**: Income/Revenue
- **5000-5999**: Expenses

## What's Next?

The foundational structure is complete. See [plan.md](./plan.md) for the detailed implementation roadmap covering:

- Accounting Engine (transaction processing)
- Projects, Revenues, and Expenses modules
- Journal Entries and Financial Reports
- Admin Panel and Testing

## License

MIT License - see LICENSE file for details
