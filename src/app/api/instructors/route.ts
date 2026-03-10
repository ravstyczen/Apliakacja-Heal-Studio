import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getInstructorsFromSheet,
  saveInstructorsToSheet,
} from '@/lib/google-sheets';
import { DEFAULT_INSTRUCTORS } from '@/lib/instructors-data';
import { isOwnerOrAdmin } from '@/lib/types';
import { getServiceAuth } from '@/lib/service-auth';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  try {
    let instructors = await getInstructorsFromSheet(serviceToken, SHEETS_ID);

    // If no instructors in sheet, initialize with defaults
    if (instructors.length === 0) {
      await saveInstructorsToSheet(
        serviceToken,
        SHEETS_ID,
        DEFAULT_INSTRUCTORS
      );
      instructors = DEFAULT_INSTRUCTORS;
    } else {
      // Ensure default instructors are present in the sheet
      // (e.g. user added a new instructor but defaults weren't seeded)
      const missingDefaults = DEFAULT_INSTRUCTORS.filter(
        (def) => !instructors.some((i) => i.id === def.id || i.email === def.email)
      );
      if (missingDefaults.length > 0) {
        instructors = [...instructors, ...missingDefaults];
        await saveInstructorsToSheet(serviceToken, SHEETS_ID, instructors);
      }
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

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  const body = await request.json();

  try {
    await saveInstructorsToSheet(serviceToken, SHEETS_ID, body.instructors);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update instructors' },
      { status: 500 }
    );
  }
}
