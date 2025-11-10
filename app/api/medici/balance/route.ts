import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBalance } from '@/lib/medici';

/**
 * GET /api/medici/balance?accountCode=1003
 *
 * Get the current balance for an account in Medici
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and accountant can view balances
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const accountCode = searchParams.get('accountCode');

    if (!accountCode) {
      return NextResponse.json(
        { error: 'accountCode parameter is required' },
        { status: 400 }
      );
    }

    const result = await getBalance(accountCode);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', details: (error as Error).message },
      { status: 500 }
    );
  }
}
