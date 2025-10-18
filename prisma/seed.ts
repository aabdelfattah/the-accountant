import { PrismaClient, AccountType, UserRole } from '@prisma/client';
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
      role: UserRole.ADMIN,
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
      role: UserRole.ACCOUNTANT,
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
      role: UserRole.USER,
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
          type: account.type as AccountType,
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
              type: subaccount.type as AccountType,
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

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`   - Created ${accountMap.size} accounts`);
  console.log(`   - Created 3 users (admin, accountant, user)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
