'use client';

import { useEffect, useRef } from 'react';
import { Destination } from '@/types';
import { regionColors } from '@/data/destinations';
import { Activity } from '@/hooks/useActivities';
import { Restaurant } from '@/hooks/useRestaurants';
import { Hotel } from '@/hooks/useHotels';
import { useItinerary } from '@/context/ItineraryContext';

interface Props {
  destination: Destination;
  activities:  Activity[];
  restaurants: Restaurant[];
  hotels:      Hotel[];
  tab:         'activities' | 'restaurants' | 'itinerary' | 'hotels';
}

export default function DestinationMap({ destination, activities, restaurants, hotels, tab }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instanceRef = useRef<any>(null);
  const { items } = useItinerary();

  useEffect(() => {
    if (!mapRef.current) return;

    const accentColor = regionColors[destination.region] ?? '#60a5fa';

    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link');
      link.id     = 'leaflet-css';
      link.rel    = 'stylesheet';
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      const Leaflet = L.default;

      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = Leaflet.map(mapRef.current!, {
        center:      [destination.coords.lat, destination.coords.lng],
        zoom:        13,
        zoomControl: true,
      });

      // OpenStreetMap — free, no API key required
      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
        subdomains: 'abc',
      }).addTo(map);

      const makePins = (
        itemsList: Array<{ title: string; rating?: number; type?: string; gps_coordinates?: { latitude: number; longitude: number } }>,
        color: string,
        shape: 'circle' | 'diamond' | 'square',
      ) => {
        itemsList.filter(a => a.gps_coordinates).forEach((item, i) => {
          const { latitude: lat, longitude: lng } = item.gps_coordinates!;
          const num   = i + 1;
          const stars = item.rating ? ` · ${item.rating.toFixed(1)}★` : '';
          let inner: string;
          if (shape === 'diamond') {
            inner = `<div style="width:22px;height:22px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
                 <span style="transform:rotate(-45deg);font-size:10px;font-weight:700;color:#000;font-family:system-ui,sans-serif;">${num}</span>
               </div>`;
          } else if (shape === 'square') {
            inner = `<div style="width:22px;height:22px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#000;font-family:system-ui,sans-serif;">${num}</div>`;
          } else {
            inner = `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#000;font-family:system-ui,sans-serif;">${num}</div>`;
          }

          const icon = Leaflet.divIcon({
            className:   '',
            html:        inner,
            iconSize:    [24, 24],
            iconAnchor:  [12, 12],
            popupAnchor: [0, -14],
          });
          Leaflet.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:system-ui,sans-serif;min-width:140px;">
                <div style="font-weight:700;font-size:12px;color:#f9fafb;margin-bottom:2px;">${num}. ${item.title}</div>
                ${item.type ? `<div style="font-size:10px;color:#9ca3af;">${item.type}${stars}</div>` : ''}
              </div>
            `);
        });
      };

      if (tab === 'restaurants') {
        makePins(restaurants, '#f43f5e', 'diamond');
      } else if (tab === 'hotels') {
        // Hotels don't have GPS from SerpAPI, so place them at destination centre with offsets
        hotels.slice(0, 10).forEach((hotel, i) => {
          const angle = (i / Math.max(hotels.length, 1)) * 2 * Math.PI;
          const radius = 0.008 + (i % 3) * 0.004;
          const lat = destination.coords.lat + Math.sin(angle) * radius;
          const lng = destination.coords.lng + Math.cos(angle) * radius;
          const num = i + 1;
          const stars = hotel.rating ? ` · ${hotel.rating.toFixed(1)}★` : '';
          const inner = `<div style="width:22px;height:22px;background:#8b5cf6;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;font-family:system-ui,sans-serif;">${num}</div>`;
          const icon = Leaflet.divIcon({ className: '', html: inner, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -13] });
          Leaflet.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:system-ui,sans-serif;min-width:140px;">
                <div style="font-weight:700;font-size:12px;color:#f9fafb;margin-bottom:2px;">${num}. ${hotel.name}</div>
                <div style="font-size:10px;color:#9ca3af;">Hotel${stars}</div>
              </div>
            `);
        });
      } else if (tab === 'itinerary') {
        const itineraryPins = items
          .map((item) => {
            const match = [...activities, ...restaurants].find((a) => a.title === item.title);
            if (match && match.gps_coordinates) {
              return {
                title: item.title,
                rating: match.rating,
                type: match.type,
                gps_coordinates: match.gps_coordinates,
                isRestaurant: item.id.startsWith('restaurant-') || (!item.id.startsWith('activity-') && item.type === 'activity'),
              };
            }
            return null;
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        const itineraryAttractions = itineraryPins.filter((p) => !p.isRestaurant);
        const itineraryRestaurants = itineraryPins.filter((p) => p.isRestaurant);

        if (itineraryAttractions.length > 0) {
          makePins(itineraryAttractions, accentColor, 'circle');
        }
        if (itineraryRestaurants.length > 0) {
          makePins(itineraryRestaurants, '#f43f5e', 'diamond');
        }

        const latlngs = itineraryPins.map((p) => [p.gps_coordinates.latitude, p.gps_coordinates.longitude] as [number, number]);
        if (latlngs.length > 1) {
          Leaflet.polyline(latlngs, { color: '#3b82f6', weight: 3, dashArray: '5, 5', opacity: 0.8 }).addTo(map);
        }
      } else {
        const placed = activities.filter(a => a.gps_coordinates);
        if (placed.length > 0) {
          makePins(activities, accentColor, 'circle');
        } else {
          // Fallback: static tourist spots
          const pinIcon = Leaflet.divIcon({
            className: '',
            html: `<div style="width:12px;height:12px;border-radius:50%;background:${accentColor};border:2px solid white;box-shadow:0 0 8px ${accentColor}80;"></div>`,
            iconSize:    [12, 12],
            iconAnchor:  [6, 6],
            popupAnchor: [0, -10],
          });
          destination.touristSpots.forEach((spot) => {
            Leaflet.marker([spot.coords.lat, spot.coords.lng], { icon: pinIcon })
              .addTo(map)
              .bindPopup(`<b style="color:#e5e7eb;font-size:13px;">${spot.name}</b>`);
          });
        }
      }

      // Let flex layout finish sizing before Leaflet measures the container
      setTimeout(() => map.invalidateSize(), 50);

      instanceRef.current = map;
    });

    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [destination.id, activities.length, restaurants.length, hotels.length, tab, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        .leaflet-container { background: #e8e0d8 !important; }
        .leaflet-popup-content-wrapper { background:#111118; border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#f9fafb; box-shadow:0 4px 24px rgba(0,0,0,0.6); }
        .leaflet-popup-content { margin:10px 14px; }
        .leaflet-popup-tip { background:#111118; }
        .leaflet-control-zoom a { background:#111118 !important; border-color:rgba(255,255,255,0.1) !important; color:#9ca3af !important; }
        .leaflet-control-zoom a:hover { background:rgba(255,255,255,0.08) !important; color:white !important; }
        .leaflet-bar { border:none !important; box-shadow:none !important; }
        .leaflet-control-attribution { display:none !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#e8e0d8' }} />
    </>
  );
}
