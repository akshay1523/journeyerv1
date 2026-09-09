export function buildGygWidgetUrl(searchQuery: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? 'demo';
  const encoded = encodeURIComponent(searchQuery);
  return `https://widget.getyourguide.com/default/activities.frame?partner_id=${partnerId}&q=${encoded}&num_items=6&currency=USD&locale=en-US&iata=false`;
}
