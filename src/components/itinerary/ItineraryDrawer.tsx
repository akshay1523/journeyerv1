'use client';

import { useItinerary } from '@/context/ItineraryContext';

export default function ItineraryDrawer() {
  const { items, removeItem, isOpen, setIsOpen, clearAll } = useItinerary();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-96 bg-[#0d0d14] border-l border-white/[0.08] z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-white font-bold text-sm">My Itinerary</h2>
            <p className="text-gray-500 text-xs mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded border border-red-900/40">
                Clear all
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600 text-sm">No items yet</p>
              <p className="text-gray-700 text-xs mt-1">Add flights, hotels and attractions</p>
            </div>
          )}

          {items.map(item => (
            <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-xs">
                    {item.type === 'flight' ? '✈️' : item.type === 'hotel' ? '🏨' : '📍'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{item.title}</p>
                {item.subtitle && <p className="text-gray-500 text-[10px] mt-0.5 truncate">{item.subtitle}</p>}
                {item.price && <p className="text-blue-400 text-xs font-bold mt-0.5">{item.price}</p>}
              </div>
              <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.08]">
            <p className="text-xs text-gray-500 text-center">{items.length} item{items.length !== 1 ? 's' : ''} in your trip plan</p>
          </div>
        )}
      </div>
    </>
  );
}