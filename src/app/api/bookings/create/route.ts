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

    const { eventId, maleQuantity = 0, femaleQuantity = 0 } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    if (!Number.isInteger(maleQuantity) || maleQuantity < 0 || !Number.isInteger(femaleQuantity) || femaleQuantity < 0) {
      return NextResponse.json({ error: 'Ticket quantities must be non-negative integers.' }, { status: 400 });
    }

    const quantity = maleQuantity + femaleQuantity;
    if (quantity < 1 || quantity > 5) {
      return NextResponse.json({ error: 'Total tickets must be between 1 and 5.' }, { status: 400 });
    }

    // Get user (profile must be completed before booking)
    let user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.id,
          email: session.email,
          name: session.name,
          image: session.image,
          role: session.role,
          gender: session.gender,
          city: session.city,
          hometown: session.hometown,
          occupation: session.occupation,
          mobile: session.mobile,
          dob: session.dob,
          instagram: session.instagram,
        },
      });
    }

    if (!user || !user.gender) {
      return NextResponse.json({ error: 'Please update your gender in your profile before booking.' }, { status: 400 });
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

    const confirmedSpots = event.bookings.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);

    if (confirmedSpots >= event.maxCapacity) {
      return NextResponse.json({ error: 'Event is sold out.' }, { status: 400 });
    }

    if (confirmedSpots + quantity > event.maxCapacity) {
      return NextResponse.json({
        error: `Only ${event.maxCapacity - confirmedSpots} spots remaining. Reduce your ticket count.`,
      }, { status: 400 });
    }

    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Event has been cancelled.' }, { status: 400 });
    }

    // Enforce 60% male capping based on male tickets in THIS order, regardless of buyer's own gender
    if (maleQuantity > 0) {
      const confirmedBookings = await prisma.booking.findMany({
        where: { eventId: event.id, status: 'CONFIRMED' },
        select: { maleQuantity: true },
      });
      const maleConfirmedCount = confirmedBookings.reduce((sum: number, b: any) => sum + (b.maleQuantity || 0), 0);

      if ((maleConfirmedCount + maleQuantity) / event.maxCapacity > 0.60) {
        return NextResponse.json({
          error: 'Male bookings cap (60% max capacity) reached for this social. Reduce male ticket count or check back later.',
        }, { status: 400 });
      }
    }

    // Per-ticket gender pricing: female discount applies only to female tickets
    const eventAny = event as any;
    const femaleUnitPrice = eventAny.genderPricingEnabled !== false
      ? Math.max(0, event.price - event.femaleDiscount)
      : event.price;
    const maleUnitPrice = event.price;

    const subtotal = (maleQuantity * maleUnitPrice) + (femaleQuantity * femaleUnitPrice);
    const taxes = Math.round(subtotal * 0.18 * 100) / 100;
    const finalAmount = subtotal + taxes;
    const amountInPaise = Math.round(finalAmount * 100);
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
        quantity,
        maleQuantity,
        femaleQuantity,
        pricePaid: maleUnitPrice,
        taxes,
        finalAmount,
      }
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      razorpayOrderId,
      amount: amountInPaise,
      quantity,
      maleQuantity,
      femaleQuantity,
      maleUnitPrice,
      femaleUnitPrice,
      taxes,
      totalAmount: finalAmount,
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
