import { NextRequest, NextResponse } from 'next/server';
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
} from '@/lib/google-sheets';
import { sendRegulationsEmail } from '@/lib/email';
import { isOwnerOrAdmin } from '@/lib/types';
import { getServiceAuth } from '@/lib/service-auth';
import { getAuthenticatedInstructor } from '@/lib/auth-mobile';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET(request: NextRequest) {
  const { instructor, email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  try {
    const clients = await getClients(serviceToken, SHEETS_ID);

    return NextResponse.json(clients, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  const body = await request.json();

  try {
    const newClient = await addClient(serviceToken, SHEETS_ID, body);

    // Send regulations email to new client
    if (body.email) {
      try {
        await sendRegulationsEmail(
          body.email,
          `${body.firstName} ${body.lastName}`,
          newClient.id
        );
      } catch (emailError) {
        console.error('Failed to send regulations email:', emailError);
        // Don't fail the client creation if email fails
      }
    }

    return NextResponse.json(newClient);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add client' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  const body = await request.json();

  try {
    await updateClient(serviceToken, SHEETS_ID, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { email } = await getAuthenticatedInstructor(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceToken = await getServiceAuth();
  if (!serviceToken) {
    return NextResponse.json({ error: 'Service account unavailable' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Client ID required' },
      { status: 400 }
    );
  }

  try {
    await deleteClient(serviceToken, SHEETS_ID, clientId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
