import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface AccountData {
  code: string;
  name: string;
  type: string;
  isSystem?: boolean;
  subaccounts?: AccountData[];
  description?: string;
}

interface ChartOfAccountsData {
  chartOfAccounts: {
    section: string;
    accounts: AccountData[];
  }[];
}

async function main() {
  console.log('Starting seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@transverse.me' },
    update: {},
    create: {
      email: 'admin@transverse.me',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create accountant user
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@transverse.me' },
    update: {},
    create: {
      email: 'accountant@transverse.me',
      name: 'Accountant User',
      password: await bcrypt.hash('accountant123', 10),
      role: 'ACCOUNTANT',
    },
  });

  console.log('Created accountant user:', accountant.email);

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@transverse.me' },
    update: {},
    create: {
      email: 'user@transverse.me',
      name: 'Regular User',
      password: await bcrypt.hash('user123', 10),
      role: 'USER',
    },
  });

  console.log('Created regular user:', user.email);

  // ============================================
  // CHART OF ACCOUNTS from JSON
  // ============================================

  const accountsJsonPath = path.join(process.cwd(), 'accounts.json');
  const accountsData: ChartOfAccountsData = JSON.parse(
    fs.readFileSync(accountsJsonPath, 'utf-8')
  );

  const accountMap = new Map<string, string>();

  // Process each section
  for (const section of accountsData.chartOfAccounts) {
    console.log(`\nProcessing ${section.section} accounts...`);

    for (const account of section.accounts) {
      // Create parent account
      const parentAccount = await prisma.chartOfAccount.upsert({
        where: { code: account.code },
        update: {},
        create: {
          code: account.code,
          name: account.name,
          type: account.type,
          isSystem: account.isSystem || false,
          description: account.description,
        },
      });
      accountMap.set(account.code, parentAccount.id);
      console.log(`  ✓ ${account.code} - ${account.name}`);

      // Create subaccounts if they exist
      if (account.subaccounts && account.subaccounts.length > 0) {
        for (const subaccount of account.subaccounts) {
          const childAccount = await prisma.chartOfAccount.upsert({
            where: { code: subaccount.code },
            update: {},
            create: {
              code: subaccount.code,
              name: subaccount.name,
              type: subaccount.type,
              parentId: parentAccount.id,
              isSystem: subaccount.isSystem || false,
            },
          });
          accountMap.set(subaccount.code, childAccount.id);
          console.log(`    → ${subaccount.code} - ${subaccount.name}`);
        }
      }
    }
  }

  // ============================================
  // SAMPLE JOURNAL ENTRIES using Medici
  // ============================================

  console.log('\nCreating sample journal entries with Medici...');

  const { createEntry } = await import('../lib/medici');

  // Entry 1: Initial capital investment
  await createEntry({
    memo: 'Initial capital investment by owners',
    date: new Date('2024-01-01'),
    transactions: [
      { type: 'debit', accountCode: '1000', amount: 50000 }, // Cash
      { type: 'credit', accountCode: '3000', amount: 50000 }, // Owner's Capital
    ],
  });
  console.log('  ✓ Initial capital investment: $50,000');

  // Entry 2: Client payment received
  await createEntry({
    memo: 'Payment received from Transperfect',
    date: new Date('2024-01-15'),
    transactions: [
      { type: 'debit', accountCode: '1001', amount: 5000 }, // PayPal
      { type: 'credit', accountCode: '4001', amount: 5000 }, // Translation Revenue
    ],
  });
  console.log('  ✓ Revenue from Transperfect: $5,000');

  // Entry 3: Freelancer payment
  await createEntry({
    memo: 'Payment to freelancer for translation work',
    date: new Date('2024-01-20'),
    transactions: [
      { type: 'debit', accountCode: '5001', amount: 2000 }, // Freelancers cost
      { type: 'credit', accountCode: '1001', amount: 2000 }, // PayPal
    ],
  });
  console.log('  ✓ Freelancer payment: $2,000');

  // Entry 4: Subscription expense
  await createEntry({
    memo: 'Monthly Canva subscription',
    date: new Date('2024-01-25'),
    transactions: [
      { type: 'debit', accountCode: '5102', amount: 120 }, // Canva
      { type: 'credit', accountCode: '1002', amount: 120 }, // Bank
    ],
  });
  console.log('  ✓ Canva subscription: $120');

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`   - Created ${accountMap.size} accounts`);
  console.log(`   - Created 3 users (admin, accountant, user)`);
  console.log(`   - Created 4 sample journal entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
