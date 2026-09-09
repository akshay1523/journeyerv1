'use client';

import { Destination } from '@/types';
import { buildGygWidgetUrl } from '@/lib/gyg';

interface Props {
  destination: Destination;
}

export default function GetYourGuideWidget({ destination }: Props) {
  const widgetUrl = buildGygWidgetUrl(destination.gygSearchQuery);
  const isDemo = !process.env.NEXT_PUBLIC_GYG_PARTNER_ID || process.env.NEXT_PUBLIC_GYG_PARTNER_ID === 'demo';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-white text-sm font-semibold">Things To Do</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">via GetYourGuide</span>
          <a
            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(destination.gygSearchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </a>
        </div>
      </div>

      {isDemo ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-900/30 border border-orange-700/30 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <p className="text-white text-sm font-semibold mb-1">Activities in {destination.city}</p>
          <p className="text-gray-500 text-xs mb-4 max-w-xs">
            Add your GetYourGuide Partner ID to display live activity listings.
          </p>
          <a
            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(destination.gygSearchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Browse Activities on GetYourGuide
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <p className="text-gray-700 text-xs mt-4">
            Set NEXT_PUBLIC_GYG_PARTNER_ID in .env.local to enable widget
          </p>
        </div>
      ) : (
        <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.06]">
          <iframe
            src={widgetUrl}
            width="100%"
            height="100%"
            style={{ minHeight: '300px' }}
            frameBorder="0"
            title={`Activities in ${destination.city}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}
    </div>
  );
}
