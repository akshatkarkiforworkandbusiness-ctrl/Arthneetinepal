import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, deleteDoc, getDocs, Timestamp, limit, startAfter, DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Clock, Plus, Edit2, Trash2, X, ChevronRight, CheckCircle, ImagePlus, Loader2 } from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────── */

interface Event {
  id: string;
  title: string;
  dateTime: any;
  location: string;
  description: string;
  category: string;
  completed?: boolean;
  studentsReached?: number;
  imageUrl?: string;
}

/* ── 3D Tilt Card ────────────────────────────────────────────────── */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`,
      transition: 'transform 0.1s ease-out',
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.4s ease-out',
    });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Category colors ─────────────────────────────────────────────── */

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Workshop:   { bg: 'bg-[#00f59b]/10', text: 'text-[#00f59b]', border: 'border-[#00f59b]/20' },
  Session:    { bg: 'bg-[#3b82f6]/10', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]/20' },
  Conference: { bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]', border: 'border-[#a855f7]/20' },
  Meetup:     { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/20' },
  Webinar:    { bg: 'bg-[#06b6d4]/10', text: 'text-[#06b6d4]', border: 'border-[#06b6d4]/20' },
  Other:      { bg: 'bg-[#94a3b8]/10', text: 'text-[#94a3b8]', border: 'border-[#94a3b8]/20' },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Other;
}

/* ── Component ───────────────────────────────────────────────────── */

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
    category: 'Workshop',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const PAGE_SIZE = 10;
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState('');

  /* ── Firestore subscription ── */
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('dateTime', 'asc'), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setEventsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'events');
        setEventsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;
    const q = query(collection(db, 'events'), orderBy('dateTime', 'asc'), startAfter(lastDoc), limit(PAGE_SIZE));
    const snapshot = await getDocs(q);
    setEvents(prev => [...prev, ...snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Event))]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
  };

  /* ── Seed placeholder ── */
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

  /* ── Image handling ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl || null;
    const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    return getDownloadURL(snapshot.ref);
  };

  /* ── Form submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const path = editingEvent ? `events/${editingEvent.id}` : 'events';

    try {
      const imageUrl = await uploadImage();
      const payload = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        category: formData.category,
        imageUrl: imageUrl || '',
        dateTime: Timestamp.fromDate(dateTime),
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), payload);
        toast.success("Event updated successfully!");
      } else {
        const eventRef = await addDoc(collection(db, 'events'), {
          ...payload,
          createdAt: serverTimestamp()
        });
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
      closeModal();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      toast.error(editingEvent ? "Failed to update event." : "Failed to publish event.");
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({ title: '', date: '', time: '', location: '', description: '', category: 'Workshop', imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        toast.success("Event deleted successfully!");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
        toast.error("Failed to delete event.");
      }
    }
  };

  const handleMarkDone = async (eventId: string) => {
    const count = parseInt(studentCount);
    if (isNaN(count) || count < 0) return;
    try {
      await updateDoc(doc(db, 'events', eventId), { completed: true, studentsReached: count });
      setMarkingDone(null);
      setStudentCount('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`);
    }
  };

  const downloadICS = (event: Event) => {
    const date = event.dateTime.toDate();
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `DTSTART:${dateStr}`, `DTEND:${dateStr}`,
      `SUMMARY:${event.title}`, `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`, "END:VEVENT", "END:VCALENDAR"
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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div>
            <span className="text-[10px] font-black text-[#00f59b] mb-4 block uppercase tracking-[0.4em]">CALENDAR</span>
            <h1 className="text-6xl md:text-8xl text-white italic font-sans tracking-tight font-semibold">Upcoming Events</h1>
            <p className="text-[#94a3b8] text-sm mt-4 max-w-md">Workshops, sessions, and talks from the Arthneeti community.</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="bg-[#00f59b] text-[#0f172a] px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-3">
              <Plus size={16} strokeWidth={3} /> Add Event
            </button>
          )}
        </div>

        {/* ─── Loading ─── */}
        {eventsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[#1F2A3F]" />
                <div className="p-8 space-y-4">
                  <div className="h-3 bg-[#1F2A3F] rounded w-20" />
                  <div className="h-6 bg-[#1F2A3F] rounded w-3/4" />
                  <div className="h-3 bg-[#1F2A3F] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Empty state ─── */}
        {!eventsLoading && events.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#161F30] border border-[#1F2A3F] flex items-center justify-center mb-8">
              <Calendar size={32} className="text-[#00f59b]" strokeWidth={1.5} />
            </div>
            <h3 className="font-sans font-semibold text-4xl text-white italic mb-4">No events yet</h3>
            <p className="text-[#94a3b8] text-sm max-w-sm leading-relaxed mb-2">Events will appear here once scheduled.</p>
            <p className="text-[#94a3b8]/40 text-xs font-black uppercase tracking-widest">Check back soon</p>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} className="mt-10 bg-[#00f59b] text-[#0f172a] px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-3">
                <Plus size={16} strokeWidth={3} /> Add First Event
              </button>
            )}
          </motion.div>
        )}

        {/* ─── Events Grid ─── */}
        {!eventsLoading && events.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event, i) => {
              const date = event.dateTime?.toDate();
              const cat = getCategoryStyle(event.category);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40, rotateX: -5 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltCard className="h-full">
                    <div className="bg-[#161F30] border border-[#1F2A3F] rounded-2xl overflow-hidden hover:border-[#00875a]/50 transition-all duration-500 group h-full flex flex-col shadow-2xl hover:shadow-[#00875a]/10">
                      {/* Image */}
                      {event.imageUrl ? (
                        <div className="relative h-48 overflow-hidden">
                          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161F30] via-transparent to-transparent" />
                          {/* Floating date badge */}
                          <div className="absolute top-4 left-4 bg-[#0f172a]/90 backdrop-blur-sm border border-[#1F2A3F] rounded-xl px-4 py-2 text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#00f59b] block">
                              {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                            </span>
                            <span className="text-2xl font-black font-mono text-white">
                              {date ? date.getDate() : '...'}
                            </span>
                          </div>
                          {/* Category badge */}
                          <div className="absolute top-4 right-4">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${cat.bg} ${cat.text} border-transparent px-3 py-1 rounded-lg backdrop-blur-sm`}>
                              {event.category}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        /* No image — date card header */
                        <div className="relative h-32 bg-gradient-to-br from-[#0B0F19] to-[#161F30] flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f59b] rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#00875a] rounded-full blur-3xl" />
                          </div>
                          <div className="relative text-center">
                            <span className="text-xs font-black uppercase tracking-widest text-[#00f59b] block mb-1">
                              {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                            </span>
                            <span className="text-5xl font-black font-mono text-white">
                              {date ? date.getDate() : '...'}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${cat.bg} ${cat.text} border-transparent px-3 py-1 rounded-lg`}>
                              {event.category}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-8 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {event.completed && (
                              <Badge className="text-[9px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border-transparent px-2 py-0.5 rounded-lg">
                                <CheckCircle size={10} className="mr-1" /> Done
                              </Badge>
                            )}
                            {event.completed && event.studentsReached !== undefined && (
                              <span className="text-[9px] font-bold text-[#94a3b8]">{event.studentsReached} students</span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-3">
                              {!event.completed && (
                                <button onClick={() => { setMarkingDone(event.id); setStudentCount(''); }} className="text-[#94a3b8]/30 hover:text-[#10b981] transition-colors" title="Mark Done">
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              <button onClick={() => {
                                setEditingEvent(event);
                                setFormData({
                                  title: event.title,
                                  date: date?.toISOString().split('T')[0] || '',
                                  time: date?.toTimeString().split(' ')[0].slice(0, 5) || '',
                                  location: event.location,
                                  description: event.description,
                                  category: event.category,
                                  imageUrl: event.imageUrl || '',
                                });
                                setImagePreview(event.imageUrl || '');
                                setShowModal(true);
                              }} className="text-[#94a3b8]/30 hover:text-white transition-colors"><Edit2 size={15} /></button>
                              <button onClick={() => handleDelete(event.id)} className="text-[#94a3b8]/30 hover:text-[#ef4444] transition-colors"><Trash2 size={15} /></button>
                            </div>
                          )}
                        </div>

                        <h3 className="text-2xl text-white font-sans font-semibold mb-4 group-hover:text-[#00f59b] transition-colors leading-tight">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-5 mb-4">
                          <div className="flex items-center gap-2 text-[#94a3b8]">
                            <Clock size={13} className="text-[#00f59b]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#94a3b8]">
                            <MapPin size={13} className="text-[#00875a]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px]">{event.location}</span>
                          </div>
                        </div>

                        <p className="text-[#94a3b8] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{event.description}</p>

                        {/* Mark done input */}
                        {isAdmin && markingDone === event.id && (
                          <div className="flex items-center gap-3 bg-[#0B0F19] rounded-xl p-4 border border-[#1F2A3F] mb-4">
                            <input type="number" min="0" placeholder="Students reached" value={studentCount} onChange={e => setStudentCount(e.target.value)}
                              className="flex-1 bg-[#161F30] p-3 rounded-lg outline-none border-2 border-transparent focus:border-[#00f59b] font-bold text-white text-sm transition-all placeholder:text-[#94a3b8]/30" autoFocus />
                            <button onClick={() => handleMarkDone(event.id)} className="px-4 py-3 bg-[#10b981] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all">Confirm</button>
                            <button onClick={() => { setMarkingDone(null); setStudentCount(''); }} className="px-4 py-3 bg-[#1F2A3F] text-[#94a3b8] rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-[#00f59b] transition-all">Cancel</button>
                          </div>
                        )}

                        {/* Actions */}
                        <button onClick={() => downloadICS(event)} className="flex items-center gap-2 text-[#94a3b8]/30 hover:text-[#00f59b] transition-all group/btn mt-auto">
                          <Calendar size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Add to Calendar</span>
                          <ChevronRight size={12} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
                        </button>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {hasMore && !eventsLoading && (
          <div className="flex justify-center mt-12">
            <button onClick={loadMore} className="px-8 py-3 bg-[#00875a]/20 text-[#00875a] border border-[#00875a]/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#00875a] hover:text-white transition-all">
              Load More
            </button>
          </div>
        )}
      </div>

      {/* ─── Admin Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-[#0f172a]/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#161F30] border border-[#1F2A3F] p-8 md:p-10 rounded-2xl max-w-2xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button onClick={closeModal} className="absolute top-6 right-6 text-[#94a3b8]/40 hover:text-white transition-colors"><X size={22} /></button>
              <h2 className="font-sans font-semibold text-3xl text-white italic mb-8">{editingEvent ? 'Edit Event' : 'New Event'}</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Event Title</label>
                  <input required type="text" className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all placeholder:text-[#94a3b8]/30" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Date</label>
                    <input required type="date" className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Time</label>
                    <input required type="time" className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Location</label>
                  <input required type="text" className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all placeholder:text-[#94a3b8]/30" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Category</label>
                  <select className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['Workshop', 'Session', 'Conference', 'Meetup', 'Webinar', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Description</label>
                  <textarea required className="w-full bg-[#0B0F19] p-4 rounded-xl outline-none focus:border-[#00f59b] border-2 border-[#1F2A3F] font-bold text-white transition-all h-24 resize-none placeholder:text-[#94a3b8]/30" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-2 block">Event Photo (optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 bg-[#0B0F19] border-2 border-dashed border-[#1F2A3F] hover:border-[#00f59b]/50 rounded-xl p-6 cursor-pointer transition-all">
                      <ImagePlus size={20} className="text-[#94a3b8]" />
                      <span className="text-xs font-bold text-[#94a3b8]">{imageFile ? imageFile.name : 'Choose an image (max 5MB)'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                    {(imagePreview || formData.imageUrl) && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#1F2A3F] shrink-0">
                        <img src={imagePreview || formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setFormData({...formData, imageUrl: ''}); }}
                          className="absolute top-1 right-1 bg-[#0f172a]/80 rounded-full p-0.5 hover:bg-[#ef4444] transition-colors">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={uploading} className="w-full bg-[#00f59b] text-[#0f172a] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading && <Loader2 size={14} className="animate-spin" />}
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
