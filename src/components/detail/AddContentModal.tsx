'use client';

import { useState } from 'react';
import { useItinerary } from '@/context/ItineraryContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContentModal({ isOpen, onClose, onSuccess }: Props) {
  const { addVideo } = useItinerary();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/parse-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process YouTube URL');
      }

      // Add to global itinerary context
      addVideo(data);
      setUrl('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-secondary-bg border border-border-color rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-secondary-text hover:text-primary-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-4">
          <div>
            <h3 className="text-primary-text text-base font-bold flex items-center gap-2">
              <span>✨</span> Extract recommendations from YouTube
            </h3>
            <p className="text-secondary-text text-xs mt-1 leading-relaxed">
              Paste a YouTube video URL (e.g. travel vlogs, guides, food tours) to extract mentioned attractions, restaurants, and hotels.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-secondary-text font-bold uppercase tracking-wider">
                YouTube Video URL
              </label>
              <input
                type="url"
                required
                value={url}
                disabled={loading}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-card-bg border border-border-color rounded-xl px-4 py-3 text-primary-text placeholder-secondary-text text-xs focus:outline-none focus:border-accent-color/50 transition-all font-semibold"
              />
            </div>

            {error && (
              <p className="text-rose-500 text-xs leading-relaxed bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-card-bg border border-border-color rounded-xl text-xs font-semibold text-secondary-text hover:text-primary-text hover:bg-secondary-bg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex-1 py-2.5 bg-accent-color hover:bg-accent-color/90 disabled:bg-card-bg disabled:text-secondary-text text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting places...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Extract Places
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
