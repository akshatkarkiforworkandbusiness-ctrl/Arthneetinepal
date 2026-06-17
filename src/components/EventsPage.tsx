import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, updateDoc, deleteDoc, getDocs, Timestamp 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, Plus, Edit2, Trash2, X, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  dateTime: any;
  location: string;
  description: string;
  category: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const checkAdmin = async () => {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'admins', user.uid));
      setIsAdmin(snap.exists());
    };
    checkAdmin();
  }, [user]);

  const [events, setEvents] = useState<Event[]>([]);
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

  useEffect(() => {
    const path = 'events';
    const q = query(collection(db, path), orderBy('dateTime', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
    return () => unsubscribe();
  }, []);

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
            <span className="text-[10px] font-black text-crimson mb-4 block uppercase tracking-[0.4em]">CALENDAR</span>
            <h1 className="text-6xl md:text-8xl text-text-primary italic font-display">Upcoming Events</h1>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-crimson text-white px-10 py-4 rounded text-xs font-black uppercase tracking-widest hover:bg-white hover:text-crimson transition-all shadow-xl flex items-center gap-3"
            >
              <Plus size={16} strokeWidth={3} /> Add Event
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {events.map((event, i) => {
            const date = event.dateTime?.toDate();
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-green-deep/5 rounded-2xl p-10 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-all duration-500 group"
              >
                {/* Date Display */}
                <div className="flex flex-col items-center justify-center bg-surface-base w-24 h-24 rounded-2xl shrink-0 border border-surface-high">
                  <span className="text-xs font-black uppercase tracking-widest text-crimson mb-1">
                    {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                  </span>
                  <span className="text-3xl font-display text-text-primary italic">
                    {date ? date.getDate() : '...'}
                  </span>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-crimson bg-crimson/10 border-transparent px-3 py-1 rounded">
                      {event.category}
                    </Badge>
                    {isAdmin && (
                      <div className="flex gap-4">
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
                        }} className="text-green-deep/20 hover:text-green-deep transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(event.id)} className="text-green-deep/20 hover:text-crimson transition-colors"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-3xl text-green-deep italic font-display group-hover:text-crimson transition-colors leading-tight">
                    {event.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-green-deep/40">
                       <Clock size={14} className="text-crimson" />
                       <span className="text-[10px] font-black uppercase tracking-widest">
                         {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                       </span>
                    </div>
                    <div className="flex items-center gap-3 text-green-deep/40">
                       <MapPin size={14} className="text-royal" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-left line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  <p className="text-green-deep/60 text-sm italic font-sans">{event.description}</p>

                  <button 
                    onClick={() => downloadICS(event)}
                    className="flex items-center gap-3 text-green-deep/20 hover:text-green-deep transition-all group/btn"
                  >
                    <Calendar size={16} className="group-hover/btn:text-crimson transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add to Calendar</span>
                    <ChevronRight size={14} className="ml-2 opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-green-deep/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-raised p-8 md:p-12 rounded-2xl max-w-2xl w-full relative shadow-2xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary transition-colors"><X size={24} /></button>
              <h2 className="font-display text-4xl text-text-primary italic mb-10">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Event Title</label>
                  <input required type="text" className="w-full bg-surface-base p-4 rounded outline-none focus:border-crimson border-2 border-surface-high font-bold text-text-primary transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Date</label>
                    <input required type="date" className="w-full bg-surface-base p-4 rounded outline-none focus:border-crimson border-2 border-surface-high font-bold text-text-primary transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Time</label>
                    <input required type="time" className="w-full bg-surface-base p-4 rounded outline-none focus:border-crimson border-2 border-surface-high font-bold text-text-primary transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Location</label>
                  <input required type="text" className="w-full bg-surface-base p-4 rounded outline-none focus:border-crimson border-2 border-surface-high font-bold text-text-primary transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Description</label>
                  <textarea required className="w-full bg-surface-base p-4 rounded outline-none focus:border-crimson border-2 border-surface-high font-bold text-text-primary transition-all h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-crimson text-white py-5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-royal transition-all shadow-xl">
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
