import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/settings';
import { cacheGet, cacheSet } from '@/lib/redis';

const SETTINGS_CACHE_KEY = 'site_settings_cache';
const CACHE_TTL_SECONDS = 5 * 60;

export async function GET() {
  try {
    const cached = await cacheGet<any>(SETTINGS_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ success: true, settings: cached });
    }

    const settings = await getSiteSettings();
    await cacheSet(SETTINGS_CACHE_KEY, settings, CACHE_TTL_SECONDS);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
