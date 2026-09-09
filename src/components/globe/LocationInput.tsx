'use client';

import { useState, useRef, useEffect } from 'react';
import { LatLng } from '@/types';

export const INDIA_CITIES: Array<{ label: string; iata: string; coords: LatLng }> = [
  { label: 'Delhi (DEL)', iata: 'DEL', coords: { lat: 28.5665, lng: 77.1031 } },
  { label: 'Mumbai (BOM)', iata: 'BOM', coords: { lat: 19.0896, lng: 72.8656 } },
  { label: 'Bangalore (BLR)', iata: 'BLR', coords: { lat: 13.1986, lng: 77.7066 } },
  { label: 'Hyderabad (HYD)', iata: 'HYD', coords: { lat: 17.2403, lng: 78.4294 } },
  { label: 'Chennai (MAA)', iata: 'MAA', coords: { lat: 12.9900, lng: 80.1693 } },
  { label: 'Kolkata (CCU)', iata: 'CCU', coords: { lat: 22.6520, lng: 88.4463 } },
  { label: 'Pune (PNQ)', iata: 'PNQ', coords: { lat: 18.5822, lng: 73.9197 } },
  { label: 'Ahmedabad (AMD)', iata: 'AMD', coords: { lat: 23.0772, lng: 72.6347 } },
  { label: 'Kochi (COK)', iata: 'COK', coords: { lat: 10.1520, lng: 76.4019 } },
  { label: 'Goa (GOI)', iata: 'GOI', coords: { lat: 15.3808, lng: 73.8314 } },
  { label: 'Jaipur (JAI)', iata: 'JAI', coords: { lat: 26.8242, lng: 75.8122 } },
  { label: 'Lucknow (LKO)', iata: 'LKO', coords: { lat: 26.7606, lng: 80.8893 } },
  { label: 'Chandigarh (IXC)', iata: 'IXC', coords: { lat: 30.6735, lng: 76.7885 } },
  { label: 'Bhubaneswar (BBI)', iata: 'BBI', coords: { lat: 20.2444, lng: 85.8178 } },
  { label: 'Nagpur (NAG)', iata: 'NAG', coords: { lat: 21.0922, lng: 79.0472 } },
  { label: 'Srinagar (SXR)', iata: 'SXR', coords: { lat: 33.9871, lng: 74.7742 } },
  { label: 'Amritsar (ATQ)', iata: 'ATQ', coords: { lat: 31.7096, lng: 74.7973 } },
  { label: 'Varanasi (VNS)', iata: 'VNS', coords: { lat: 25.4524, lng: 82.8593 } },
  { label: 'Thiruvananthapuram (TRV)', iata: 'TRV', coords: { lat: 8.4821, lng: 76.9201 } },
  { label: 'Indore (IDR)', iata: 'IDR', coords: { lat: 22.7218, lng: 75.8011 } },
];

interface Props {
  onOriginSet: (iata: string, coords: LatLng) => void;
  currentIata: string | null;
  inline?: boolean;
}

export default function LocationInput({ onOriginSet, currentIata, inline = false }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length > 0
    ? INDIA_CITIES.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : INDIA_CITIES;

  const selectedCity = INDIA_CITIES.find((c) => c.iata === currentIata);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('[data-location-input]')?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      data-location-input
      className={inline ? "w-full relative" : "absolute bottom-8 left-8 z-20 w-72"}
    >
      {!inline && (
        <p className="text-xs text-secondary-text mb-1.5 font-medium tracking-widest uppercase">
          Departing From
        </p>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selectedCity?.label ?? '')}
          placeholder="Select your city..."
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-secondary-bg border border-border-color rounded-xl pl-4 pr-10 py-2 text-primary-text placeholder-secondary-text text-xs focus:outline-none focus:border-accent-color/50 transition-all font-semibold"
        />
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {open && (
        <div className={`absolute z-30 w-full bg-secondary-bg border border-border-color rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto ${inline ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}>
          {filtered.map((city) => (
            <button
              key={city.iata}
              type="button"
              className="w-full text-left px-4 py-2 text-xs text-primary-text hover:bg-card-bg hover:text-accent-color transition-colors font-medium"
              onMouseDown={() => {
                onOriginSet(city.iata, city.coords);
                setOpen(false);
                setQuery('');
              }}
            >
              {city.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
