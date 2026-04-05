import React, { createContext, useContext, useState } from 'react'

export interface EventItem {
  id: number | string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  candidates?: Array<{
    id: string;
    name: string;
    party: string;
    image?: string;
    slogan?: string;
    votes?: number;
  }>;
}

interface EventContextType {
  events: EventItem[];
  addEvent: (ev: EventItem) => void;
  setEvents: (events: EventItem[]) => void;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEvent = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>([]);

  const addEvent = (ev: EventItem) => {
    setEvents(prev => [...prev, ev]);
  };

  return (
    <EventContext.Provider value={{ events, addEvent, setEvents }}>
      {children}
    </EventContext.Provider>
  );
};

export default EventContext;
