'use client';

import { useState, useEffect } from 'react';
import { DayPicker, DateRange as DPDateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { Destination, DateRange } from '@/types';
import { regionColors } from '@/data/destinations';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

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
    <Dialog open={true} onOpenChange={(open) => { if (!open) onBack(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Destination header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to globe
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
            <div>
              <h2 className="text-foreground text-lg font-semibold tracking-tight leading-tight">{destination.city}</h2>
              <p className="text-muted-foreground text-sm">{destination.country}</p>
            </div>
          </div>
          <p className="text-muted-foreground/80 text-xs mt-3">Select your travel dates</p>
        </div>

        {/* Calendar */}
        <div className="flex justify-center px-4 py-4">
          <style>{`
            .rdp {
              --rdp-accent-color: ${accentColor};
              --rdp-background-color: hsl(var(--muted));
              margin: 0;
            }
            .rdp-day_selected, .rdp-day_range_start, .rdp-day_range_end {
              background-color: ${accentColor} !important;
              color: white !important;
            }
            .rdp-day_range_middle {
              background-color: ${accentColor}22 !important;
              color: hsl(var(--foreground)) !important;
            }
            .rdp-day { color: hsl(var(--foreground)); }
            .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: hsl(var(--muted)) !important;
            }
            .rdp-head_cell { color: hsl(var(--muted-foreground)); font-size: 0.7rem; }
            .rdp-caption_label { color: hsl(var(--foreground)); font-weight: 600; }
            .rdp-nav_button { color: hsl(var(--muted-foreground)); }
            .rdp-day_disabled { opacity: 0.25; color: hsl(var(--muted-foreground)) !important; }
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
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
              <p className="text-muted-foreground text-xs mb-0.5">Departure</p>
              <p className="text-foreground text-sm font-medium">
                {range?.from ? format(range.from, 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
              <p className="text-muted-foreground text-xs mb-0.5">Return</p>
              <p className="text-foreground text-sm font-medium">
                {range?.to ? format(range.to, 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full h-11 text-sm font-semibold"
            style={canConfirm ? { backgroundColor: accentColor } : undefined}
          >
            Search Flights →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
