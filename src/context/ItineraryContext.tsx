'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  title: string;
  subtitle?: string;
  price?: string;
  thumbnail?: string;
  description?: string;
}

export interface ExtractedPlace {
  name: string;
  type: 'attraction' | 'restaurant' | 'hotel';
  country: string;
  description: string;
}

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  places: ExtractedPlace[];
}

interface ItineraryContextType {
  items: ItineraryItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: ItineraryItem) => void;
  removeItem: (id: string) => void;
  isAdded: (id: string) => boolean;
  clearAll: () => void;
  
  // YouTube Content recommendations
  videos: YouTubeVideoData[];
  addVideo: (video: YouTubeVideoData) => void;
  removeVideo: (videoId: string) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

const KEY = 'journeyer-itinerary';
const VIDEOS_KEY = 'journeyer-videos';

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [videos, setVideos] = useState<YouTubeVideoData[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
      
      const savedVideos = localStorage.getItem(VIDEOS_KEY);
      if (savedVideos) {
        setVideos(JSON.parse(savedVideos));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addItem = useCallback((item: ItineraryItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      const updated = [...prev, item];
      try {
        localStorage.setItem(KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const isAdded = useCallback((id: string) => {
    return items.some((i) => i.id === id);
  }, [items]);

  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Video recommendations helpers
  const addVideo = useCallback((video: YouTubeVideoData) => {
    setVideos((prev) => {
      if (prev.some((v) => v.videoId === video.videoId)) return prev;
      const updated = [...prev, video];
      try {
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const removeVideo = useCallback((videoId: string) => {
    setVideos((prev) => {
      const updated = prev.filter((v) => v.videoId !== videoId);
      try {
        localStorage.setItem(VIDEOS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  return (
    <ItineraryContext.Provider value={{
      items,
      isOpen,
      setIsOpen,
      addItem,
      removeItem,
      isAdded,
      clearAll,
      videos,
      addVideo,
      removeVideo
    }}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItinerary() {
  const context = useContext(ItineraryContext);
  if (context === undefined) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }
  return context;
}