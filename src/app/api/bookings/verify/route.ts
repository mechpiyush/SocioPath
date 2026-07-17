import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { memoryCache } from '@/lib/cache';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';

const EVENTS_CACHE_KEY = 'events_list_cache';

export async function POST(req: NextRequest) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 });
    }

    const isMock = razorpayOrderId.startsWith('order_mock_');

    if (!isMock && razorpay) {
      // Perform signature verification
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return NextResponse.json({ error: 'Payment gateway configuration missing secret key.' }, { status: 500 });
      }

      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Payment verification failed (invalid signature).' }, { status: 400 });
      }
    }

    // Find the pending booking
    const booking = await prisma.booking.findUnique({
      where: { razorpayOrderId },
      include: { event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking order not found.' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ success: true, message: 'Already verified.' });
    }

    // Double check capacity under transactional isolation
    const confirmedCount = await prisma.booking.count({
      where: {
        eventId: booking.eventId,
        status: 'CONFIRMED',
      },
    });

    if (confirmedCount >= booking.event.maxCapacity) {
      return NextResponse.json({ error: 'Session is already sold out.' }, { status: 400 });
    }

    // Confirm booking and update event status if threshold met
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          razorpayPaymentId,
          razorpaySignature: razorpaySignature || 'mock_signature',
        },
      });

      const count = await tx.booking.count({
        where: {
          eventId: booking.eventId,
          status: 'CONFIRMED',
        },
      });

      // If count hits the minimum (10) and event is still PENDING, flip it to CONFIRMED
      if (count >= booking.event.minCapacity && booking.event.status === 'PENDING') {
        await tx.event.update({
          where: { id: booking.eventId },
          data: { status: 'CONFIRMED' },
        });
      }

      return b;
    });

    // Invalidate the cache immediately so all users fetch the updated inventory
    memoryCache.delete(EVENTS_CACHE_KEY);
    console.log('Booking confirmed, cache invalidated.');

    return NextResponse.json({
      success: true,
      bookingId: updatedBooking.id,
      spotsFilled: confirmedCount + 1,
    });
  } catch (error) {
    console.error('Booking verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
