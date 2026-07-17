import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { razorpay } from '@/lib/razorpay';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    // Get event and confirm capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.bookings.length >= event.maxCapacity) {
      return NextResponse.json({ error: 'Event is sold out.' }, { status: 400 });
    }

    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Event has been cancelled.' }, { status: 400 });
    }

    const amountInPaise = Math.round(event.price * 100); // 150000 paise
    let razorpayOrderId: string;

    if (razorpay) {
      // Create real Razorpay order
      try {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `receipt_${Date.now()}_${eventId.substring(0, 8)}`,
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Razorpay Order Creation failed:', err);
        return NextResponse.json({ error: 'Failed to initialize payment gateway.' }, { status: 500 });
      }
    } else {
      // Developer / Mock Mode order id
      razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Create pending booking in DB
    const booking = await prisma.booking.create({
      data: {
        userId: session.id,
        eventId: event.id,
        razorpayOrderId,
        status: 'PENDING',
      }
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      razorpayOrderId,
      amount: amountInPaise,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id',
      isMock: !razorpay,
      eventTitle: event.title,
      userName: session.name,
      userEmail: session.email,
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
