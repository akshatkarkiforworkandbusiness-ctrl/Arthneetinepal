import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, updateDoc, deleteDoc, getDocs, Timestamp, limit, startAfter, DocumentSnapshot 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, Plus, Edit2, Trash2, X, ChevronRight, CheckCircle } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  dateTime: any;
  location: string;
  description: string;
  category: string;
  completed?: boolean;
  studentsReached?: number;
}

export default function EventsPage() {
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    category: 'Workshop'
  });

  const PAGE_SIZE = 10;
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState('');
  useEffect(() => {
    const path = 'events';
    const q = query(collection(db, path), orderBy('dateTime', 'asc'), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setEventsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setEventsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;
    const path = 'events';
    const q = query(collection(db, path), orderBy('dateTime', 'asc'), startAfter(lastDoc), limit(PAGE_SIZE));
    const snapshot = await getDocs(q);
    setEvents(prev => [...prev, ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event))]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
  };

  // Seeding initial placeholder if empty
  useEffect(() => {
    const seed = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        if (snap.empty && isAdmin) {
          await addDoc(collection(db, 'events'), {
            title: "Arthneeti Orientation Session",
            description: "Open to all interested high schools in Kathmandu. Learn about our vision and modules.",
            location: "TBD (Kathmandu schools)",
            category: "Session",
            dateTime: Timestamp.fromDate(new Date('2025-06-15T10:00:00')),
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.warn("Seeding events skipped or failed", err);
      }
    };
    seed();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const path = editingEvent ? `events/${editingEvent.id}` : 'events';
    
    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), {
          ...formData,
          dateTime: Timestamp.fromDate(dateTime)
        });
        toast.success("Event updated successfully!");
      } else {
        const eventRef = await addDoc(collection(db, 'events'), {
          ...formData,
          dateTime: Timestamp.fromDate(dateTime),
          createdAt: serverTimestamp()
        });

        // Cross-post to Community Feed
        await addDoc(collection(db, 'posts'), {
          title: `New Event: ${formData.title}`,
          author: 'Arthneeti Admin',
          authorId: user?.uid || 'admin',
          category: 'Other',
          type: 'discussion',
          content: `We just added a new event: ${formData.title}. \n\nLocation: ${formData.location} \nDescription: ${formData.description}`,
          createdAt: serverTimestamp(),
          likes: 0,
          commentCount: 0,
          eventId: eventRef.id
        });
        toast.success("Event published successfully!");
      }
      setShowModal(false);
      setEditingEvent(null);
      setFormData({ title: '', date: '', time: '', location: '', description: '', category: 'Workshop' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      toast.error(editingEvent ? "Failed to update event." : "Failed to publish event.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this event?')) {
      const path = `events/${id}`;
      try {
        await deleteDoc(doc(db, 'events', id));
        toast.success("Event deleted successfully!");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
        toast.error("Failed to delete event.");
      }
    }
  };

  const handleMarkDone = async (eventId: string) => {
    const count = parseInt(studentCount);
    if (isNaN(count) || count < 0) return;
    const path = `events/${eventId}`;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'events', eventId), {
        completed: true,
        studentsReached: count,
      });
      setMarkingDone(null);
      setStudentCount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const downloadICS = (event: Event) => {
    const date = event.dateTime.toDate();
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}`,
      `DTEND:${dateStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calendar event (.ics) downloaded!");
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-32 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
          <div>
            <span className="text-[10px] font-black text-electric-mint mb-4 block uppercase tracking-[0.4em]">CALENDAR</span>
            <h1 className="text-6xl md:text-8xl text-slate-base italic font-sans tracking-tight font-semibold">Upcoming Events</h1>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-electric-mint text-slate-base px-10 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white hover:text-electric-mint transition-all shadow-xl flex items-center gap-3"
            >
              <Plus size={16} strokeWidth={3} /> Add Event
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {eventsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-base/5 rounded-lg-2xl p-10 flex gap-10 animate-pulse">
                <div className="w-24 h-24 rounded-lg-2xl bg-slate-raised shrink-0" />
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-3 bg-slate-raised rounded-lg w-20" />
                  <div className="h-6 bg-slate-raised rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-raised rounded-lg w-1/2" />
                  <div className="h-3 bg-slate-raised rounded-lg w-full" />
                  <div className="h-3 bg-slate-raised rounded-lg w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — shown to everyone when no events exist */}
        {!eventsLoading && events.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-lg bg-slate-raised flex items-center justify-center mb-8">
              <Calendar size={32} className="text-electric-mint" strokeWidth={1.5} />
            </div>
            <h3 className="font-sans tracking-tight font-semibold text-4xl text-slate-base italic mb-4">No events yet</h3>
            <p className="text-slate-base/50 text-sm max-w-sm leading-relaxed mb-2">
              Arthneeti events — workshops, sessions, and talks — will appear here once scheduled.
            </p>
            <p className="text-slate-base/30 text-xs font-black uppercase tracking-widest">
              Check back soon
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-10 bg-electric-mint text-slate-base px-10 py-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green transition-all shadow-xl flex items-center gap-3"
              >
                <Plus size={16} strokeWidth={3} /> Add First Event
              </button>
            )}
          </motion.div>
        )}

        {/* Events grid */}
        {!eventsLoading && events.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event, i) => {
              const date = event.dateTime?.toDate();
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-slate-base/5 rounded-lg-2xl p-10 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-all duration-500 group"
                >
                  {/* Date Display */}
                  <div className="flex flex-col items-center justify-center bg-slate-raised w-24 h-24 rounded-lg-2xl shrink-0 border border-slate-base/5">
                    <span className="text-xs font-black uppercase tracking-widest text-electric-mint mb-1">
                      {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                    </span>
                    <span className="text-3xl font-sans tracking-tight font-semibold text-slate-base italic">
                      {date ? date.getDate() : '...'}
                    </span>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-electric-mint bg-electric-mint/10 border-transparent px-3 py-1 rounded-lg">
                        {event.category}
                      </Badge>
                      <div className="flex items-center gap-4">
                        {event.completed && (
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border-transparent px-3 py-1 rounded-lg">
                              ✓ Done
                            </Badge>
                            {event.studentsReached !== undefined && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-base/40">
                                {event.studentsReached} students reached
                              </span>
                            )}
                          </div>
                        )}
                        {isAdmin && (
                          <div className="flex gap-4">
                            {!event.completed && (
                              <button
                                onClick={() => { setMarkingDone(event.id); setStudentCount(''); }}
                                className="text-slate-base/20 hover:text-green-600 transition-colors"
                                title="Mark as Done"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button onClick={() => {
                              setEditingEvent(event);
                              setFormData({
                                title: event.title,
                                date: date?.toISOString().split('T')[0] || '',
                                time: date?.toTimeString().split(' ')[0].slice(0,5) || '',
                                location: event.location,
                                description: event.description,
                                category: event.category
                              });
                              setShowModal(true);
                            }} className="text-slate-base/20 hover:text-slate-base transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(event.id)} className="text-slate-base/20 hover:text-electric-mint transition-colors"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-3xl text-slate-base italic font-sans tracking-tight font-semibold group-hover:text-electric-mint transition-colors leading-tight">
                      {event.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-slate-base/40">
                         <Clock size={14} className="text-electric-mint" />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                           {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-base/40">
                         <MapPin size={14} className="text-club-green" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-left line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    <p className="text-slate-base/60 text-sm italic font-sans">{event.description}</p>

                    {isAdmin && markingDone === event.id && (
                      <div className="flex items-center gap-3 bg-slate-raised rounded-lg p-4 border border-slate-base/10">
                        <input
                          type="number"
                          min="0"
                          placeholder="Students reached"
                          value={studentCount}
                          onChange={e => setStudentCount(e.target.value)}
                          className="flex-1 bg-white p-3 rounded-lg outline-none border-2 border-transparent focus:border-electric-mint font-bold text-slate-base text-sm transition-all"
                          autoFocus
                        />
                        <button
                          onClick={() => handleMarkDone(event.id)}
                          className="px-4 py-3 bg-green-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setMarkingDone(null); setStudentCount(''); }}
                          className="px-4 py-3 bg-slate-raised text-slate-base/40 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-electric-mint transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={() => downloadICS(event)}
                      className="flex items-center gap-3 text-slate-base/20 hover:text-slate-base transition-all group/btn"
                    >
                      <Calendar size={16} className="group-hover/btn:text-electric-mint transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add to Calendar</span>
                      <ChevronRight size={14} className="ml-2 opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {hasMore && !eventsLoading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-club-green/20 text-club-green border border-club-green/30 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-club-green hover:text-white transition-all"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-slate-base/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 md:p-12 rounded-lg-2xl max-w-2xl w-full relative shadow-2xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-base/20 hover:text-slate-base transition-colors"><X size={24} /></button>
              <h2 className="font-sans tracking-tight font-semibold text-4xl text-slate-base italic mb-10">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Event Title</label>
                  <input required type="text" className="w-full bg-slate-raised p-4 rounded-lg outline-none focus:border-electric-mint border-2 border-transparent font-bold text-slate-base transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Date</label>
                    <input required type="date" className="w-full bg-slate-raised p-4 rounded-lg outline-none focus:border-electric-mint border-2 border-transparent font-bold text-slate-base transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Time</label>
                    <input required type="time" className="w-full bg-slate-raised p-4 rounded-lg outline-none focus:border-electric-mint border-2 border-transparent font-bold text-slate-base transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Location</label>
                  <input required type="text" className="w-full bg-slate-raised p-4 rounded-lg outline-none focus:border-electric-mint border-2 border-transparent font-bold text-slate-base transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-base/40 mb-2 block">Description</label>
                  <textarea required className="w-full bg-slate-raised p-4 rounded-lg outline-none focus:border-electric-mint border-2 border-transparent font-bold text-slate-base transition-all h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-electric-mint text-slate-base py-5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-club-green transition-all shadow-xl">
                  {editingEvent ? 'SAVE CHANGES' : 'PUBLISH EVENT'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
