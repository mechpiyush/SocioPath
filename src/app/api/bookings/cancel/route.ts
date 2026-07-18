import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { razorpay } from '@/lib/razorpay';
import { memoryCache } from '@/lib/cache';

const EVENTS_CACHE_KEY = 'events_list_cache';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.userId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this booking.' }, { status: 403 });
    }

    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Only confirmed bookings can be cancelled.' }, { status: 400 });
    }

    // Validate date check: 3 days prior
    const eventDate = new Date(booking.event.date);
    const threeDaysPrior = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > threeDaysPrior) {
      return NextResponse.json({
        error: 'Cancellations are only permitted at least 3 days (72 hours) prior to the event.',
      }, { status: 400 });
    }

    // Process refund
    let refundLog = '';
    if (booking.razorpayPaymentId) {
      const isMock = booking.razorpayPaymentId.startsWith('mock_');
      if (!isMock && razorpay) {
        try {
          await razorpay.payments.refund(booking.razorpayPaymentId, {
            notes: { reason: `User cancelled booking ${booking.id} 3+ days prior to event.` }
          });
          refundLog = `Razorpay refund completed for payment ${booking.razorpayPaymentId}.`;
        } catch (err: any) {
          console.error(`Razorpay refund failed for payment ${booking.razorpayPaymentId}:`, err);
          return NextResponse.json({ error: 'Failed to process refund on payment gateway. Please try again later.' }, { status: 500 });
        }
      } else {
        refundLog = `[MOCK] Refunded simulated payment ${booking.razorpayPaymentId}.`;
      }
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'REFUNDED' },
    });

    // If event is CONFIRMED and active bookings drop below minCapacity (10), we can flip it back to PENDING.
    // Let's count current confirmed bookings for this event:
    const activeCount = await prisma.booking.count({
      where: {
        eventId: booking.eventId,
        status: 'CONFIRMED',
      },
    });

    if (activeCount < booking.event.minCapacity && booking.event.status === 'CONFIRMED') {
      await prisma.event.update({
        where: { id: booking.eventId },
        data: { status: 'PENDING' },
      });
    }

    // Invalidate the cache
    memoryCache.delete(EVENTS_CACHE_KEY);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully and refund initiated.',
      booking: updatedBooking,
      refundLog,
    });
  } catch (error) {
    console.error('Booking cancellation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
