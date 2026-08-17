export function getVenueMapEmbedUrl(venue?: string | null, venueMapUrl?: string | null): string {
  if (venueMapUrl && venueMapUrl.trim()) {
    return venueMapUrl.trim();
  }

  const query = encodeURIComponent(venue?.trim() || 'Mumbai, Maharashtra');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
  }

  return `https://www.google.com/maps?q=${query}&output=embed`;
}
