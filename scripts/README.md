# Database Scripts

## Overview

This directory contains database management scripts that handle database structure requirements not supported by Prisma natively.

## Scripts

### `init-database.js` - Database Initialization

Creates required sparse unique indexes for journal entry references.

**What it does:**

- Creates sparse unique indexes on `revenues.journalEntryId` and `expenses.journalEntryId`
- These indexes allow multiple `null` values (unpaid transactions) but ensure uniqueness for non-null values
- Safe to run multiple times (idempotent)

**Why is this needed?**

Prisma doesn't support creating sparse indexes in the schema file. In our cash accounting system:

- Only **PAID** revenues/expenses have journal entries (`journalEntryId` is set)
- **UNPAID** revenues/expenses have `journalEntryId = null`
- We need to allow **many unpaid** transactions (multiple nulls)
- But ensure **one journal entry per revenue/expense** (unique non-null values)

MongoDB sparse indexes ignore null values, giving us exactly this behavior:

```
✓ Revenue A: journalEntryId = null (allowed - unpaid)
✓ Revenue B: journalEntryId = null (allowed - unpaid)
✓ Revenue C: journalEntryId = "abc123" (allowed - paid)
✗ Revenue D: journalEntryId = "abc123" (ERROR - duplicate!)
```

**When to run:**

```bash
# Local development (first time)
npm run db:init

# Production deployment (Railway)
# Run ONCE after deploying to production for the first time
npm run db:init

# Or manually via MongoDB shell
mongosh $DATABASE_URL --eval '
  db.revenues.createIndex({ journalEntryId: 1 }, { unique: true, sparse: true })
  db.expenses.createIndex({ journalEntryId: 1 }, { unique: true, sparse: true })
'
```

**Production Deployment Checklist:**

1. Deploy application to Railway
2. Railway runs `prisma generate` and `prisma db push` automatically
3. **Manually run** `npm run db:init` once via Railway CLI or dashboard
4. Indexes are now created and will persist across redeployments

**Note:** Once created, these indexes persist in the database. You only need to run this script:

- After initial deployment to a new environment
- After dropping/recreating the database
- If indexes are accidentally deleted

## Railway Deployment

### Option 1: Via Railway CLI (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the init script in production
railway run npm run db:init
```

### Option 2: Via Railway Dashboard

1. Go to your Railway project
2. Click on your service
3. Go to "Settings" → "Deploy"
4. Add a one-time deployment command:
   ```
   npm run db:init
   ```
5. Or use the Railway shell to run manually

### Option 3: Add to Build Command (One-Time)

In your Railway project settings, temporarily update the build command to:

```
prisma generate && npm run build && npm run db:init
```

After successful deployment, remove `&& npm run db:init` from the build command (only needs to run once).

## Verifying Indexes

To verify indexes are created correctly:

```bash
# Via npm script
npm run db:init

# Via MongoDB shell
mongosh $DATABASE_URL --eval '
  print("=== Revenues Indexes ===")
  db.revenues.getIndexes().forEach(idx => printjson(idx))

  print("\n=== Expenses Indexes ===")
  db.expenses.getIndexes().forEach(idx => printjson(idx))
'
```

You should see indexes with `unique: true` and `sparse: true`.

## Troubleshooting

### "Index already exists" warning

This is normal when running the script multiple times. The script is idempotent.

### "E11000 duplicate key error"

This means you have duplicate non-null `journalEntryId` values in your data. Run:

```bash
# Find duplicate journal entries
mongosh $DATABASE_URL --eval '
  db.revenues.aggregate([
    { $match: { journalEntryId: { $ne: null } } },
    { $group: { _id: "$journalEntryId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ])
'
```

### "Cannot connect to database"

Ensure `DATABASE_URL` environment variable is set correctly in your Railway environment.

## Related Documentation

- [Prisma Schema](../prisma/schema.prisma) - See `Revenue` and `Expense` models
- [CLAUDE.md](../CLAUDE.md) - See "Cash Accounting Basis" section
- [MongoDB Sparse Indexes](https://www.mongodb.com/docs/manual/core/index-sparse/)
