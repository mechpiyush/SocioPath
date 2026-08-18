export const SETTINGS_ID = 'singleton';

export const DEFAULT_SETTINGS = {
  siteName: 'SocioPath',
  tagline: "Mumbai's Premium Late-Night Social Experience",
  logoUrl: '',
  faviconUrl: '',
  metaTitle: 'SocioPath | Premium Late-Night Social Experience in Mumbai',
  metaDescription: "Book exclusive late-night weekend villa retreats in Mumbai. Join Friday Night Jam (music & karaoke) or Saturday Night Social (stranger icebreakers & board games). BYOD-friendly, ₹1,500 all-inclusive.",
  metaKeywords: 'SocioPath, Mumbai late night, weekend social, villa party Mumbai, karaoke Mumbai, stranger meetups, networking Mumbai',
  aboutUsContent: '',
  privacyPolicyContent: '',
  termsContent: '',
  supportEmail: 'iiit.piyush@gmail.com',
  footerText: '',
  linkedinUrl: 'https://in.linkedin.com/in/piyush-sharma21',
  teamMembers: [
    {
      name: 'Piyush Sharma',
      role: 'Founder & Owner',
      credentials: 'B.Tech CSE, IIT Mandi',
      photo: '',
      linkedin: 'https://in.linkedin.com/in/piyush-sharma21',
    },
  ],
};

export type SiteSettingsShape = typeof DEFAULT_SETTINGS;

// Server-only — reads the singleton settings row and merges it over defaults
// so any field an admin hasn't set yet still has a sane fallback.
export async function getSiteSettings(): Promise<SiteSettingsShape> {
  const { prisma } = await import('@/lib/db');
  try {
    const record = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!record) return DEFAULT_SETTINGS;

    return {
      siteName: record.siteName || DEFAULT_SETTINGS.siteName,
      tagline: record.tagline || DEFAULT_SETTINGS.tagline,
      logoUrl: record.logoUrl || DEFAULT_SETTINGS.logoUrl,
      faviconUrl: record.faviconUrl || DEFAULT_SETTINGS.faviconUrl,
      metaTitle: record.metaTitle || DEFAULT_SETTINGS.metaTitle,
      metaDescription: record.metaDescription || DEFAULT_SETTINGS.metaDescription,
      metaKeywords: record.metaKeywords || DEFAULT_SETTINGS.metaKeywords,
      aboutUsContent: record.aboutUsContent || DEFAULT_SETTINGS.aboutUsContent,
      privacyPolicyContent: record.privacyPolicyContent || DEFAULT_SETTINGS.privacyPolicyContent,
      termsContent: record.termsContent || DEFAULT_SETTINGS.termsContent,
      supportEmail: record.supportEmail || DEFAULT_SETTINGS.supportEmail,
      footerText: record.footerText || DEFAULT_SETTINGS.footerText,
      linkedinUrl: record.linkedinUrl || DEFAULT_SETTINGS.linkedinUrl,
      teamMembers: (record.teamMembers as any) || DEFAULT_SETTINGS.teamMembers,
    };
  } catch (err) {
    console.error('Failed to load site settings, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}
