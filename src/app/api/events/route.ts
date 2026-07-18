import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { memoryCache } from '@/lib/cache';

const EVENTS_CACHE_KEY = 'events_list_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Try to get from cache first
    const cachedEvents = memoryCache.get(EVENTS_CACHE_KEY);
    if (cachedEvents) {
      console.log('Serving events from cache');
      return NextResponse.json({ events: cachedEvents, cached: true });
    }

    // Query DB with booking count
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { bookings: { where: { status: 'CONFIRMED' } } }
        }
      },
      orderBy: { date: 'asc' }
    });

    const mappedEvents = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      price: event.price,
      femaleDiscount: event.femaleDiscount,
      minCapacity: event.minCapacity,
      maxCapacity: event.maxCapacity,
      status: event.status,
      spotsFilled: event._count.bookings,
    }));

    // Cache the result
    memoryCache.set(EVENTS_CACHE_KEY, mappedEvents, CACHE_TTL_MS);
    console.log('Caching fresh events query');

    return NextResponse.json({ events: mappedEvents, cached: false });
  } catch (error) {
    console.error('Events endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
