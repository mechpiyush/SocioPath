import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { razorpay } from '@/lib/razorpay';
import { memoryCache } from '@/lib/cache';

const EVENTS_CACHE_KEY = 'events_list_cache';

function checkAdmin(session: any) {
  if (!session) return false;
  if (session.role === 'ADMIN') return true;
  if (session.email === 'iiit.piyush@gmail.com') return true;
  if (process.env.ADMIN_EMAIL && session.email === process.env.ADMIN_EMAIL) return true;
  return false;
}

// GET all events (including cancelled, with full bookings count)
export async function GET() {
  try {
    const session = await getSession();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      include: {
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                gender: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Admin events fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create event
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { title, description, date, price, femaleDiscount, genderPricingEnabled, minCapacity, maxCapacity } = await req.json();

    if (!title || !description || !date || price === undefined) {
      return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 });
    }

    const eventData: any = {
      title,
      description,
      date: new Date(date),
      price: parseFloat(price),
      femaleDiscount: femaleDiscount !== undefined ? parseFloat(femaleDiscount) : 0,
      genderPricingEnabled: genderPricingEnabled !== undefined ? Boolean(genderPricingEnabled) : true,
      minCapacity: minCapacity !== undefined ? parseInt(minCapacity) : 10,
      maxCapacity: maxCapacity !== undefined ? parseInt(maxCapacity) : 20,
      status: 'PENDING',
    };

    const event = await prisma.event.create({
      data: eventData,
    });

    memoryCache.delete(EVENTS_CACHE_KEY);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Admin create event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT edit event
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id, title, description, date, price, femaleDiscount, genderPricingEnabled, minCapacity, maxCapacity, status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    const updateData: any = {
      title: title || undefined,
      description: description || undefined,
      date: date ? new Date(date) : undefined,
      price: price !== undefined ? parseFloat(price) : undefined,
      femaleDiscount: femaleDiscount !== undefined ? parseFloat(femaleDiscount) : undefined,
      genderPricingEnabled: genderPricingEnabled !== undefined ? Boolean(genderPricingEnabled) : undefined,
      minCapacity: minCapacity !== undefined ? parseInt(minCapacity) : undefined,
      maxCapacity: maxCapacity !== undefined ? parseInt(maxCapacity) : undefined,
      status: status || undefined,
    };

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    memoryCache.delete(EVENTS_CACHE_KEY);

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Admin edit event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE cancel event with immediate refund
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!checkAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required.' }, { status: 400 });
    }

    // Find the event and all confirmed bookings
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const refundLogs: string[] = [];

    // Perform inside a transaction
    await prisma.$transaction(async (tx: any) => {
      // Mark event as CANCELLED
      await tx.event.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Refund all bookings immediately
      for (const booking of event.bookings) {
        if (booking.razorpayPaymentId) {
          const isMock = booking.razorpayPaymentId.startsWith('mock_');
          if (!isMock && razorpay) {
            try {
              await razorpay.payments.refund(booking.razorpayPaymentId, {
                notes: { reason: `Event "${event.title}" cancelled by administrator.` },
              });
              refundLogs.push(`Refunded booking ${booking.id} (Razorpay payment: ${booking.razorpayPaymentId})`);
            } catch (err: any) {
              console.error(`Razorpay refund failed for booking ${booking.id}:`, err);
              refundLogs.push(`FAILED to refund booking ${booking.id} (${booking.razorpayPaymentId})`);
            }
          } else {
            refundLogs.push(`[MOCK] Refunded booking ${booking.id} (Mock payment: ${booking.razorpayPaymentId})`);
          }
        }

        // Mark booking as REFUNDED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'REFUNDED' },
        });
      }
    });

    memoryCache.delete(EVENTS_CACHE_KEY);

    return NextResponse.json({
      success: true,
      message: 'Event cancelled and immediate refunds processed.',
      refundLogs,
    });
  } catch (error) {
    console.error('Admin cancel event error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
