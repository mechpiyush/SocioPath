import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_TICKETS_PER_BOOKING = 5;

// POST /api/bookings/reserve — soft-hold seat(s) for a few minutes before checkout.
// This is a best-effort UX lock (reduces double-booking races while a user is on the
// checkout screen); the authoritative capacity check still happens in bookings/create.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { eventId, quantity } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_BOOKING) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 5.' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { bookings: { where: { status: 'CONFIRMED' } } },
    });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const confirmedSpots = event.bookings.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);

    const now = new Date();
    const activeHolds = await prisma.seatReservation.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        userId: { not: session.id },
      },
      select: { quantity: true },
    });
    const heldByOthers = activeHolds.reduce((sum: number, h: any) => sum + h.quantity, 0);

    if (confirmedSpots + heldByOthers + quantity > event.maxCapacity) {
      return NextResponse.json({
        error: 'Not enough spots available right now — some may be held by other users mid-checkout. Please try again shortly.',
      }, { status: 400 });
    }

    const expiresAt = new Date(now.getTime() + HOLD_DURATION_MS);

    const reservation = await prisma.seatReservation.upsert({
      where: { eventId_userId: { eventId, userId: session.id } },
      update: { quantity, expiresAt, status: 'ACTIVE' },
      create: {
        id: crypto.randomUUID(),
        eventId,
        userId: session.id,
        quantity,
        expiresAt,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, reservation, holdExpiresAt: expiresAt });
  } catch (error) {
    console.error('Seat reservation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/bookings/reserve?eventId=... — release a held seat early
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
    }

    await prisma.seatReservation.deleteMany({
      where: { eventId, userId: session.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Seat reservation release error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
