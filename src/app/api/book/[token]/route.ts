import { NextRequest, NextResponse } from 'next/server';
import { getServiceAuth } from '@/lib/service-auth';
import {
  getBookingByToken,
  addBookingSignup,
  addClient,
  BookingSignup,
} from '@/lib/google-sheets';
import {
  sendBookingConfirmation,
  sendSessionFullEmail,
} from '@/lib/email';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const serviceAuth = await getServiceAuth();
  if (!serviceAuth) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }

  const booking = await getBookingByToken(serviceAuth, SHEETS_ID, token);
  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    sessionType: booking.sessionType,
    instructorName: booking.instructorName,
    maxSlots: booking.maxSlots,
    currentSignups: booking.signups.length,
    isFull: booking.signups.length >= booking.maxSlots,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const { firstName, lastName, email } = body;
  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: 'Imię, nazwisko i email są wymagane' },
      { status: 400 }
    );
  }

  const serviceAuth = await getServiceAuth();
  if (!serviceAuth) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }

  const booking = await getBookingByToken(serviceAuth, SHEETS_ID, token);
  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  // Check if already full
  if (booking.signups.length >= booking.maxSlots) {
    // Send "session full" email
    try {
      await sendSessionFullEmail(
        email,
        `${firstName} ${lastName}`,
        booking.date,
        `${booking.startTime} - ${booking.endTime}`,
        booking.sessionType
      );
    } catch {
      // Don't fail if email fails
    }

    return NextResponse.json(
      { error: 'Sesja jest już pełna', full: true },
      { status: 409 }
    );
  }

  // Check for duplicate signup
  const alreadySignedUp = booking.signups.some(
    (s) => s.email.toLowerCase() === email.toLowerCase()
  );
  if (alreadySignedUp) {
    return NextResponse.json(
      { error: 'Już jesteś zapisany/a na tę sesję' },
      { status: 409 }
    );
  }

  // Add signup
  const signup: BookingSignup = {
    firstName,
    lastName,
    email,
    signedUpAt: new Date().toISOString(),
  };

  const result = await addBookingSignup(serviceAuth, SHEETS_ID, token, signup);
  if (!result.success) {
    if (result.full) {
      try {
        await sendSessionFullEmail(
          email,
          `${firstName} ${lastName}`,
          booking.date,
          `${booking.startTime} - ${booking.endTime}`,
          booking.sessionType
        );
      } catch {
        // Don't fail if email fails
      }
      return NextResponse.json(
        { error: 'Sesja jest już pełna', full: true },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Nie udało się zapisać na sesję' },
      { status: 500 }
    );
  }

  // Add as a client to the Klienci sheet
  try {
    await addClient(serviceAuth, SHEETS_ID, {
      firstName,
      lastName,
      phone: '',
      email,
      isOwnerClient: false,
      regulationsAccepted: false,
      regulationsAcceptedDate: null,
    });
  } catch {
    // Client might already exist, that's OK
  }

  // Send confirmation email
  try {
    await sendBookingConfirmation(
      email,
      `${firstName} ${lastName}`,
      booking.date,
      `${booking.startTime} - ${booking.endTime}`,
      booking.sessionType
    );
  } catch {
    // Don't fail if email fails
  }

  return NextResponse.json({ success: true });
}
