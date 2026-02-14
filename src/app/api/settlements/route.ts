import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSettlements, getMonthlySettlement } from '@/lib/google-sheets';
import { isOwnerOrAdmin } from '@/lib/types';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const instructor = (session as any).instructor;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const instructorId = searchParams.get('instructorId') || undefined;
  const view = searchParams.get('view') || 'list'; // 'list' or 'monthly'

  try {
    // Regular instructors can only see their own settlements
    const filterInstructorId =
      instructor && !isOwnerOrAdmin(instructor.role)
        ? instructor.id
        : instructorId;

    if (view === 'monthly') {
      if (!month) {
        return NextResponse.json(
          { error: 'Month parameter required for monthly view' },
          { status: 400 }
        );
      }
      const data = await getMonthlySettlement(
        accessToken,
        SHEETS_ID,
        month,
        filterInstructorId
      );
      return NextResponse.json(data);
    }

    const settlements = await getSettlements(
      accessToken,
      SHEETS_ID,
      month,
      filterInstructorId
    );
    return NextResponse.json(settlements);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}
