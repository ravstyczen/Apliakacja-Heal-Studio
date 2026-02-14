import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getClients,
  addClient,
  updateClient,
  deleteClient,
} from '@/lib/google-sheets';
import { sendRegulationsEmail } from '@/lib/email';
import { isOwnerOrAdmin } from '@/lib/types';

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const instructor = (session as any).instructor;

  try {
    let clients = await getClients(accessToken, SHEETS_ID);

    // Filter out owner clients for regular instructors
    if (instructor && !isOwnerOrAdmin(instructor.role)) {
      clients = clients.filter((c) => !c.isOwnerClient);
    }

    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const body = await request.json();

  try {
    const newClient = await addClient(accessToken, SHEETS_ID, body);

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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const body = await request.json();

  try {
    await updateClient(accessToken, SHEETS_ID, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Client ID required' },
      { status: 400 }
    );
  }

  try {
    await deleteClient(accessToken, SHEETS_ID, clientId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
