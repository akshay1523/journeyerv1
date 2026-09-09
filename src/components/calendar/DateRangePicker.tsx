'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker, DateRange as DPDateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { Destination, DateRange } from '@/types';
import { regionColors } from '@/data/destinations';
import 'react-day-picker/style.css';

interface Props {
  destination: Destination;
  onConfirm: (range: DateRange) => void;
  onBack: () => void;
}

const today = new Date();
const minDate = addDays(today, 3);

export default function DateRangePicker({ destination, onConfirm, onBack }: Props) {
  const [range, setRange] = useState<DPDateRange | undefined>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);

  // Escape key closes calendar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  // Click outside closes calendar
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) onBack();
  };

  const canConfirm =
    range?.from &&
    range?.to &&
    range.from >= minDate &&
    range.to > range.from;

  const handleConfirm = () => {
    if (canConfirm && range?.from && range?.to) {
      onConfirm({ departure: range.from, returnDate: range.to });
    }
  };

  const accentColor = regionColors[destination.region] ?? '#60a5fa';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div ref={cardRef} className="bg-secondary-bg border border-border-color rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Destination header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-color/40">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-secondary-text hover:text-primary-text text-xs mb-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to globe
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <div>
              <h2 className="text-primary-text text-lg font-semibold leading-tight">{destination.city}</h2>
              <p className="text-secondary-text text-sm">{destination.country}</p>
            </div>
          </div>
          <p className="text-secondary-text/80 text-xs mt-3">Select your travel dates</p>
        </div>

        {/* Calendar */}
        <div className="flex justify-center px-4 py-4">
          <style>{`
            .rdp {
              --rdp-accent-color: ${accentColor};
              --rdp-background-color: var(--bg-card);
              --rdp-accent-color-dark: ${accentColor};
              --rdp-background-color-dark: var(--bg-card);
              margin: 0;
            }
            .rdp-day_selected, .rdp-day_range_start, .rdp-day_range_end {
              background-color: ${accentColor} !important;
              color: white !important;
            }
            .rdp-day_range_middle {
              background-color: ${accentColor}22 !important;
              color: var(--text-primary) !important;
            }
            .rdp-day { color: var(--text-primary); }
            .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: var(--bg-card) !important;
            }
            .rdp-head_cell { color: var(--text-secondary); font-size: 0.7rem; }
            .rdp-caption_label { color: var(--text-primary); font-weight: 600; }
            .rdp-nav_button { color: var(--text-secondary); }
            .rdp-day_disabled { opacity: 0.25; color: var(--text-secondary) !important; }
          `}</style>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={{ before: minDate }}
            numberOfMonths={1}
            showOutsideDays={false}
          />
        </div>

        {/* Date summary */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card-bg border border-border-color rounded-lg px-3 py-2.5">
              <p className="text-secondary-text text-xs mb-0.5">Departure</p>
              <p className="text-primary-text text-sm font-medium">
                {range?.from ? format(range.from, 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="bg-card-bg border border-border-color rounded-lg px-3 py-2.5">
              <p className="text-secondary-text text-xs mb-0.5">Return</p>
              <p className="text-primary-text text-sm font-medium">
                {range?.to ? format(range.to, 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canConfirm ? accentColor : 'var(--bg-card)',
              color: canConfirm ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            Search Flights →
          </button>
        </div>
      </div>
    </div>
  );
}
