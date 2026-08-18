import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getSiteSettings, SETTINGS_ID } from '@/lib/settings';
import { cacheDel } from '@/lib/redis';

const SETTINGS_CACHE_KEY = 'site_settings_cache';

export async function GET() {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      siteName, tagline, logoUrl, faviconUrl, metaTitle, metaDescription, metaKeywords,
      aboutUsContent, privacyPolicyContent, termsContent, supportEmail, footerText,
      linkedinUrl, teamMembers,
    } = body;

    const data: any = {
      siteName: siteName || undefined,
      tagline: tagline !== undefined ? (tagline || null) : undefined,
      logoUrl: logoUrl !== undefined ? (logoUrl || null) : undefined,
      faviconUrl: faviconUrl !== undefined ? (faviconUrl || null) : undefined,
      metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
      metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
      metaKeywords: metaKeywords !== undefined ? (metaKeywords || null) : undefined,
      aboutUsContent: aboutUsContent !== undefined ? (aboutUsContent || null) : undefined,
      privacyPolicyContent: privacyPolicyContent !== undefined ? (privacyPolicyContent || null) : undefined,
      termsContent: termsContent !== undefined ? (termsContent || null) : undefined,
      supportEmail: supportEmail !== undefined ? (supportEmail || null) : undefined,
      footerText: footerText !== undefined ? (footerText || null) : undefined,
      linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl || null) : undefined,
      teamMembers: teamMembers !== undefined ? teamMembers : undefined,
    };

    const settings = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: data,
      create: { id: SETTINGS_ID, ...data },
    });

    await cacheDel(SETTINGS_CACHE_KEY);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
