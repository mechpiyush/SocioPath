import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

// GET /api/reviews/event?eventId=... — list reviews for a specific event
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
    }

    const reviews = await prisma.eventReview.findMany({
      where: { eventId },
      include: {
        User: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch event reviews error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/reviews/event — leave a review for a specific booking (one per booking)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { bookingId, rating, comment } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 5.' }, { status: 400 });
    }
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { EventReview: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    if (booking.userId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this booking.' }, { status: 403 });
    }
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only confirmed bookings can be reviewed.' }, { status: 400 });
    }
    if (booking.EventReview) {
      return NextResponse.json({ error: 'You have already reviewed this booking.' }, { status: 400 });
    }

    const review = await prisma.eventReview.create({
      data: {
        id: crypto.randomUUID(),
        eventId: booking.eventId,
        userId: session.id,
        bookingId: booking.id,
        rating: Math.round(rating),
        comment: comment.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Create event review error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
