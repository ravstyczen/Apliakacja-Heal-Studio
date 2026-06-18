import { NextRequest, NextResponse } from 'next/server';
import { getSettlements, getMonthlySettlement } from '@/lib/google-sheets';
import { isOwnerOrAdmin } from '@/lib/types';
import { getServiceAuth } from '@/lib/service-auth';
import { getAuthenticatedInstructor } from '@/lib/auth-mobile';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET(request: NextRequest) {
  const { instructor, email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const instructorId = searchParams.get('instructorId') || undefined;
  const view = searchParams.get('view') || 'list'; // 'list' or 'monthly'

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

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
        serviceToken,
        SHEETS_ID,
        month,
        filterInstructorId
      );
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    }

    const settlements = await getSettlements(
      serviceToken,
      SHEETS_ID,
      month,
      filterInstructorId
    );
    return NextResponse.json(settlements, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}
