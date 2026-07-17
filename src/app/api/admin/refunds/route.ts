import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { razorpay } from '@/lib/razorpay';
import { memoryCache } from '@/lib/cache';

const EVENTS_CACHE_KEY = 'events_list_cache';

export async function POST() {
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find events scheduled in the next 24 hours that are still PENDING (under-capacity threshold)
    const failedEvents = await prisma.event.findMany({
      where: {
        date: {
          lte: targetTime,
          gte: now
        },
        status: 'PENDING'
      },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' }
        }
      }
    });

    const refundLogs: string[] = [];
    const processedEvents: string[] = [];

    for (const event of failedEvents) {
      // Process database transaction for updates
      await prisma.$transaction(async (tx) => {
        // Mark event as CANCELLED
        await tx.event.update({
          where: { id: event.id },
          data: { status: 'CANCELLED' }
        });
        processedEvents.push(event.title);

        // Process refunds for each confirmed booking
        for (const booking of event.bookings) {
          if (booking.razorpayPaymentId) {
            const isMock = booking.razorpayPaymentId.startsWith('mock_');
            if (!isMock && razorpay) {
              try {
                // Actual Razorpay Refund API call
                await razorpay.payments.refund(booking.razorpayPaymentId, {
                  notes: { reason: `Event cancelled: Minimum guest threshold of 10 not met.` }
                });
                refundLogs.push(`Refunded ₹1,500 to booking ${booking.id} (Razorpay payment: ${booking.razorpayPaymentId})`);
              } catch (err) {
                console.error(`Razorpay refund failed for payment ${booking.razorpayPaymentId}:`, err);
                refundLogs.push(`FAILED to refund booking ${booking.id} (Razorpay payment: ${booking.razorpayPaymentId})`);
              }
            } else {
              // Simulated / Mock mode refund
              refundLogs.push(`[MOCK] Refunded ₹1,500 to booking ${booking.id} (Mock payment: ${booking.razorpayPaymentId})`);
            }
          }

          // Mark booking as REFUNDED
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: 'REFUNDED' }
          });
        }
      });
    }

    if (failedEvents.length > 0) {
      // Invalidate the cache since statuses changed
      memoryCache.delete(EVENTS_CACHE_KEY);
    }

    return NextResponse.json({
      success: true,
      eventsProcessed: processedEvents.length,
      cancelledEvents: processedEvents,
      refundLogs
    });
  } catch (error) {
    console.error('Admin refunds processor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
