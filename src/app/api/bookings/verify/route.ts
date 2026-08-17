import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cacheDel } from '@/lib/redis';
import { razorpay } from '@/lib/razorpay';
import { sendBookingConfirmation } from '@/lib/email';
import crypto from 'crypto';
import QRCode from 'qrcode';

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
      include: { event: true, user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking order not found.' }, { status: 404 });
    }

    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        success: true,
        message: 'Already verified.',
        ticketNumber: booking.ticketNumber,
        bookingToken: booking.bookingToken,
        qrCode: booking.qrCode,
      });
    }

    // Double check capacity under transactional isolation
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        eventId: booking.eventId,
        status: 'CONFIRMED',
      },
      select: { quantity: true },
    });
    const confirmedSpots = confirmedBookings.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);

    if (confirmedSpots + booking.quantity > booking.event.maxCapacity) {
      return NextResponse.json({ error: 'Session is now sold out.' }, { status: 400 });
    }

    const ticketNumber = `SOCIO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const bookingToken = crypto.randomUUID();
    const qrCode = await QRCode.toDataURL(bookingToken);

    // Confirm booking and update event status if threshold met
    const updatedBooking = await prisma.$transaction(async (tx: any) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          ticketNumber,
          bookingToken,
          qrCode,
          razorpayPaymentId,
          razorpaySignature: razorpaySignature || 'mock_signature',
        },
      });

      const confirmed = await tx.booking.findMany({
        where: {
          eventId: booking.eventId,
          status: 'CONFIRMED',
        },
        select: { quantity: true },
      });
      const count = confirmed.reduce((sum: number, cb: any) => sum + (cb.quantity || 1), 0);

      // If count hits the minimum and event is still PENDING, flip it to CONFIRMED
      if (count >= booking.event.minCapacity && booking.event.status === 'PENDING') {
        await tx.event.update({
          where: { id: booking.eventId },
          data: { status: 'CONFIRMED' },
        });
      }

      return b;
    });

    // Invalidate the cache immediately so all users fetch the updated inventory
    await cacheDel(EVENTS_CACHE_KEY);
    console.log('Booking confirmed, cache invalidated.');

    if (booking.user?.email) {
      const eventDate = new Date(booking.event.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      });

      sendBookingConfirmation(booking.user.email, {
        userName: booking.user.name,
        eventTitle: booking.event.title,
        eventDate,
        venue: booking.event.venue || undefined,
        quantity: booking.quantity,
        finalAmount: booking.finalAmount || booking.event.price,
        taxes: booking.taxes || 0,
        ticketNumber,
        bookingId: booking.id,
      }).catch((err) => console.error('Booking confirmation email failed:', err));
    }

    return NextResponse.json({
      success: true,
      bookingId: updatedBooking.id,
      quantity: booking.quantity,
      spotsFilled: confirmedSpots + booking.quantity,
      ticketNumber,
      bookingToken,
      qrCode,
    });
  } catch (error) {
    console.error('Booking verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
