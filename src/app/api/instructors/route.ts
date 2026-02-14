import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getInstructorsFromSheet,
  saveInstructorsToSheet,
} from '@/lib/google-sheets';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';
import { isOwnerOrAdmin } from '@/lib/types';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const instructor = (session as any).instructor;
  if (!instructor || !isOwnerOrAdmin(instructor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accessToken = (session as any).accessToken;

  try {
    let instructors = await getInstructorsFromSheet(accessToken, SHEETS_ID);

    // If no instructors in sheet, initialize with defaults
    if (instructors.length === 0) {
      await saveInstructorsToSheet(
        accessToken,
        SHEETS_ID,
        DEFAULT_INSTRUCTORS
      );
      instructors = DEFAULT_INSTRUCTORS;
    }

    return NextResponse.json(instructors);
  } catch (error: any) {
    // Fallback to default data
    return NextResponse.json(DEFAULT_INSTRUCTORS);
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const instructor = (session as any).instructor;
  if (!instructor || !isOwnerOrAdmin(instructor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accessToken = (session as any).accessToken;
  const body = await request.json();

  try {
    await saveInstructorsToSheet(accessToken, SHEETS_ID, body.instructors);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update instructors' },
      { status: 500 }
    );
  }
}
