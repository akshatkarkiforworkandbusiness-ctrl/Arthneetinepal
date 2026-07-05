import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, deleteDoc, getDocs, Timestamp, limit, startAfter, DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Plus, X, ImagePlus, Loader2, MapPin, Clock, Download, Edit2, CheckCircle2, ChevronRight, Share2, Trash2 } from 'lucide-react';
import AnimatedEventCard from './AnimatedEventCard';
import { Brand3DText } from './Brand3DText';

const EventScene = lazy(() => import('./EventScene'));

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

/* ── Component ───────────────────────────────────────────────────── */

export default function EventsPage() {
  const { user, isAdmin } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '', date: '', time: '', location: '', description: '', category: 'Workshop', imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const PAGE_SIZE = 10;
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState('');
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  /* ── Firestore ── */
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('dateTime', 'asc'), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const newIds = new Set<string>();
        snapshot.docs.forEach(d => {
          const existing = events.find(e => e.id === d.id);
          if (!existing) newIds.add(d.id);
        });
        if (newIds.size > 0) setNewEventIds(prev => new Set([...prev, ...newIds]));

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

  useEffect(() => {
    const seedAndApplyImages = async () => {
      if (!isAdmin) return;
      try {
        const snap = await getDocs(collection(db, 'events'));
        const images = [
          '/Pitcures for Arthneeti/Image 1 — Inaugural session (503020 Rule).jpg',
          '/Pitcures for Arthneeti/Image 2 — SOS Disability Center.jpg',
          '/Pitcures for Arthneeti/Image 3 — St. Lawrence School.png',
          '/Pitcures for Arthneeti/Image 4 — Kathmandu Valley Public School.png',
          '/Pitcures for Arthneeti/Image 5 — Problem solving session.jpg',
          '/Pitcures for Arthneeti/Image 6 — Think Big. Invest Smart. Lead Nepal..jpg',
        ];

        let imgIdx = 0;
        
        // 1. Update existing events if they don't have images
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (!data.imageUrl && imgIdx < images.length) {
            await updateDoc(docSnap.ref, { imageUrl: images[imgIdx] });
          }
          imgIdx++;
        }

        // 2. If there are fewer events than images, create the remaining events
        while (imgIdx < images.length) {
          await addDoc(collection(db, 'events'), {
            title: `Arthneeti Session ${imgIdx + 1}`,
            description: "Financial literacy and investing session for students.",
            location: "Kathmandu Valley",
            category: "Session",
            dateTime: Timestamp.fromDate(new Date(`2025-06-${15 + imgIdx}T10:00:00`)),
            createdAt: serverTimestamp(),
            imageUrl: images[imgIdx]
          });
          imgIdx++;
        }
      } catch (err) {
        console.warn("Seeding events skipped or failed", err);
      }
    };
    seedAndApplyImages();
  }, [isAdmin]);

  /* ── Image ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.imageUrl || null;
    const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    return getDownloadURL(snapshot.ref);
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const path = editingEvent ? `events/${editingEvent.id}` : 'events';

    try {
      const imageUrl = await uploadImage();
      const payload = {
        title: formData.title, date: formData.date, time: formData.time,
        location: formData.location, description: formData.description,
        category: formData.category, imageUrl: imageUrl || '',
        dateTime: Timestamp.fromDate(dateTime),
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), payload);
        toast.success("Event updated successfully!");
      } else {
        const eventRef = await addDoc(collection(db, 'events'), { ...payload, createdAt: serverTimestamp() });
        setNewEventIds(prev => new Set([...prev, eventRef.id]));
        await addDoc(collection(db, 'posts'), {
          title: `New Event: ${formData.title}`, author: 'Arthneeti Admin',
          authorId: user?.uid || 'admin', category: 'Other', type: 'discussion',
          content: `We just added a new event: ${formData.title}. \n\nLocation: ${formData.location} \nDescription: ${formData.description}`,
          createdAt: serverTimestamp(), likes: 0, commentCount: 0, eventId: eventRef.id
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
      try { await deleteDoc(doc(db, 'events', id)); toast.success("Event deleted!"); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, `events/${id}`); toast.error("Failed to delete."); }
    }
  };

  const handleMarkDone = async (eventId: string) => {
    const count = parseInt(studentCount);
    if (isNaN(count) || count < 0) return;
    try { await updateDoc(doc(db, 'events', eventId), { completed: true, studentsReached: count }); setMarkingDone(null); setStudentCount(''); }
    catch (error) { handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`); }
  };

  const downloadICS = (event: Event) => {
    const date = event.dateTime.toDate();
    const dateStr = date.toISOString().replace(/-|:|\.\d+/g, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `DTSTART:${dateStr}`, `DTEND:${dateStr}`,
      `SUMMARY:${event.title}`, `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`, "END:VEVENT", "END:VCALENDAR"].join("\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Calendar event downloaded!");
  };

  const openEditModal = (event: Event) => {
    const date = event.dateTime?.toDate();
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: date?.toISOString().split('T')[0] || '',
      time: date?.toTimeString().split(' ')[0].slice(0, 5) || '',
      location: event.location, description: event.description,
      category: event.category, imageUrl: event.imageUrl || '',
    });
    setImagePreview(event.imageUrl || '');
    setShowModal(true);
  };

  return (
    <main className="relative py-32 px-6 min-h-screen overflow-hidden">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <EventScene />
      </Suspense>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ─── Header ─── */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <motion.span
              className="text-[10px] font-black text-[#847dff] mb-4 block uppercase tracking-[0.4em]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              CALENDAR
            </motion.span>
            
            <Brand3DText className="justify-start ml-[-8px] mb-4" light={true} />

            <motion.h1
              className="text-6xl md:text-8xl text-white italic font-sans tracking-tight font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Upcoming Events
            </motion.h1>
            <motion.p
              className="text-[#9f9fa0] text-sm mt-4 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Workshops, sessions, and talks from the Arthneeti community.
            </motion.p>
          </div>
          {isAdmin && (
            <motion.button
              onClick={() => setShowModal(true)}
              className="bg-white text-[#090a0b] px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Plus size={16} strokeWidth={3} /> Add Event
            </motion.button>
          )}
        </motion.div>

        {/* ─── Loading ─── */}
        {eventsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#090a0b] border border-white/[0.06] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[#2e2e2e]" />
                <div className="p-8 space-y-4">
                  <div className="h-3 bg-[#2e2e2e] rounded w-20" />
                  <div className="h-6 bg-[#2e2e2e] rounded w-3/4" />
                  <div className="h-3 bg-[#2e2e2e] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Empty ─── */}
        {!eventsLoading && events.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
            <motion.div
              className="w-24 h-24 rounded-2xl bg-[#090a0b] border border-white/[0.06] flex items-center justify-center mb-8"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Calendar size={36} className="text-[#847dff]" strokeWidth={1.5} />
            </motion.div>
            <h3 className="font-sans font-semibold text-4xl text-white italic mb-4">No events yet</h3>
            <p className="text-[#9f9fa0] text-sm max-w-sm leading-relaxed mb-2">Events will appear here once scheduled.</p>
            <p className="text-[#9f9fa0]/40 text-xs font-black uppercase tracking-widest">Check back soon</p>
            {isAdmin && (
              <motion.button onClick={() => setShowModal(true)} className="mt-10 bg-white text-[#090a0b] px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-3" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Plus size={16} strokeWidth={3} /> Add First Event
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ─── Events Grid ─── */}
        {!eventsLoading && events.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {events.map((event, i) => (
                <AnimatedEventCard
                  key={event.id}
                  event={event}
                  index={i}
                  isAdmin={isAdmin}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onMarkDone={(id) => { setMarkingDone(id); setStudentCount(''); }}
                  onDownloadICS={downloadICS}
                  markingDone={markingDone}
                  studentCount={studentCount}
                  onStudentCountChange={setStudentCount}
                  onConfirmDone={handleMarkDone}
                  onCancelDone={() => { setMarkingDone(null); setStudentCount(''); }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {hasMore && !eventsLoading && (
          <motion.div className="flex justify-center mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <motion.button onClick={loadMore} className="px-8 py-3 bg-[#847dff]/10 text-[#847dff] border border-[#847dff]/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#847dff] hover:text-white transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Load More
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* ─── Admin Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-[#0f1011]/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40, rotateX: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              className="bg-[#090a0b] border border-white/[0.06] p-8 md:p-10 rounded-2xl max-w-2xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ perspective: '1000px' }}
            >
              <button onClick={closeModal} className="absolute top-6 right-6 text-[#9f9fa0]/40 hover:text-white transition-colors"><X size={22} /></button>
              <motion.h2
                className="font-sans font-semibold text-3xl text-white italic mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {editingEvent ? 'Edit Event' : 'New Event'}
              </motion.h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: 'Event Title', key: 'title', type: 'text', required: true },
                ].map((field, i) => (
                  <motion.div key={field.key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">{field.label}</label>
                    <input required={field.required} type={field.type}
                      className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all placeholder:text-[#9f9fa0]/30"
                      value={(formData as any)[field.key]} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  </motion.div>
                ))}

                <motion.div className="grid grid-cols-2 gap-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Date</label>
                    <input required type="date" className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Time</label>
                    <input required type="time" className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Location</label>
                  <input required type="text" className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all placeholder:text-[#9f9fa0]/30" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Category</label>
                  <select className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {['Workshop', 'Session', 'Conference', 'Meetup', 'Webinar', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Description</label>
                  <textarea required className="w-full bg-[#0f1011] p-4 rounded-xl outline-none focus:border-[#847dff] border-2 border-white/[0.06] font-bold text-white transition-all h-24 resize-none placeholder:text-[#9f9fa0]/30" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9f9fa0] mb-2 block">Event Photo (optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 bg-[#0f1011] border-2 border-dashed border-white/[0.06] hover:border-[#847dff]/50 rounded-xl p-6 cursor-pointer transition-all">
                      <ImagePlus size={20} className="text-[#9f9fa0]" />
                      <span className="text-xs font-bold text-[#9f9fa0]">{imageFile ? imageFile.name : 'Choose an image (max 5MB)'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                    {(imagePreview || formData.imageUrl) && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/[0.06] shrink-0">
                        <img src={imagePreview || formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setFormData({ ...formData, imageUrl: '' }); }}
                          className="absolute top-1 right-1 bg-[#0f1011]/80 rounded-full p-0.5 hover:bg-[#ef4444] transition-colors">
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.button type="submit" disabled={uploading}
                  className="w-full bg-white text-[#090a0b] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                >
                  {uploading && <Loader2 size={14} className="animate-spin" />}
                  {editingEvent ? 'SAVE CHANGES' : 'PUBLISH EVENT'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
