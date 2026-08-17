import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/redis';
import { getVenueMapEmbedUrl } from '@/lib/maps';

const EVENTS_CACHE_KEY = 'events_list_cache';
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes

export async function GET() {
  try {
    const cachedEvents = await cacheGet<any[]>(EVENTS_CACHE_KEY);
    if (cachedEvents) {
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
      genderPricingEnabled: event.genderPricingEnabled,
      minCapacity: event.minCapacity,
      maxCapacity: event.maxCapacity,
      status: event.status,
      spotsFilled: event._count.bookings,
      venue: event.venue,
      venueMapEmbedUrl: getVenueMapEmbedUrl(event.venue, event.venueMapUrl),
    }));

    await cacheSet(EVENTS_CACHE_KEY, mappedEvents, CACHE_TTL_SECONDS);

    return NextResponse.json({ events: mappedEvents, cached: false });
  } catch (error) {
    console.error('Events endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
