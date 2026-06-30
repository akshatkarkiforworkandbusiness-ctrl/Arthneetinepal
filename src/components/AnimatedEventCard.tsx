import { motion, useInView } from 'motion/react';
import { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, CheckCircle, Edit2, Trash2, ChevronRight } from 'lucide-react';

const CardScene3D = lazy(() => import('./CardScene3D'));

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

interface Props {
  event: Event;
  index: number;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onMarkDone: (id: string) => void;
  onDownloadICS: (event: Event) => void;
  markingDone: string | null;
  studentCount: string;
  onStudentCountChange: (val: string) => void;
  onConfirmDone: (eventId: string) => void;
  onCancelDone: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Workshop: '#00f59b',
  Session: '#3b82f6',
  Conference: '#a855f7',
  Meetup: '#f59e0b',
  Webinar: '#06b6d4',
  Other: '#94a3b8',
};

/* ── Animated Text Reveal ────────────────────────────────────────── */

function AnimatedText({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ delay: delay + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Typewriter Effect ───────────────────────────────────────────── */

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [inView, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text, speed]);

  return (
    <span ref={ref} className="inline">
      {displayed}
      {started && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[#00f59b] ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}

/* ── 3D Tilt Card ────────────────────────────────────────────────── */

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(`perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.03,1.03,1.03)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export default function AnimatedEventCard({
  event, index, isAdmin, onEdit, onDelete, onMarkDone, onDownloadICS,
  markingDone, studentCount, onStudentCountChange, onConfirmDone, onCancelDone
}: Props) {
  const date = event.dateTime?.toDate();
  const catColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Other;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.4 }
      }}
    >
      <TiltCard className="h-full">
        <div
          className="relative bg-[#161F30] border border-[#1F2A3F] rounded-2xl overflow-hidden group h-full flex flex-col"
          style={{ boxShadow: `0 0 40px ${catColor}08, 0 25px 50px rgba(0,0,0,0.4)` }}
        >
          {/* Glowing top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" style={{ background: `linear-gradient(90deg, transparent, ${catColor}, transparent)` }} />

          {/* Header: Image OR 3D Scene */}
          {event.imageUrl ? (
            <div className="relative h-52 overflow-hidden">
              <motion.img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161F30] via-[#161F30]/20 to-transparent" />

              {/* Floating date */}
              <motion.div
                className="absolute top-4 left-4 bg-[#0f172a]/90 backdrop-blur-md border border-[#1F2A3F] rounded-xl px-4 py-2.5 text-center z-10"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: catColor }}>
                  {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {date ? date.getDate() : '...'}
                </span>
              </motion.div>

              {/* Category */}
              <motion.div
                className="absolute top-4 right-4 z-10"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-transparent px-3 py-1 rounded-lg backdrop-blur-sm" style={{ background: `${catColor}20`, color: catColor }}>
                  {event.category}
                </Badge>
              </motion.div>
            </div>
          ) : (
            /* ── 3D Object Header ── */
            <div className="relative h-56 overflow-hidden">
              {/* 3D Scene */}
              <Suspense fallback={
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0B0F19 0%, #161F30 50%, ${catColor}08 100%)` }} />
              }>
                <CardScene3D color={catColor} category={event.category} />
              </Suspense>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#161F30] via-[#161F30]/40 to-transparent z-10 pointer-events-none" />

              {/* Floating date badge */}
              <motion.div
                className="absolute top-4 left-4 bg-[#0f172a]/90 backdrop-blur-md border border-[#1F2A3F] rounded-xl px-4 py-2.5 text-center z-20"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              >
                <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: catColor }}>
                  {date ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date) : '...'}
                </span>
                <span className="text-2xl font-black font-mono text-white">
                  {date ? date.getDate() : '...'}
                </span>
              </motion.div>

              {/* Category badge */}
              <motion.div
                className="absolute top-4 right-4 z-20"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-transparent px-3 py-1 rounded-lg backdrop-blur-sm" style={{ background: `${catColor}20`, color: catColor }}>
                  {event.category}
                </Badge>
              </motion.div>
            </div>
          )}

          {/* Content */}
          <div className="p-8 flex flex-col flex-1 relative z-10">
            {/* Status + Admin actions */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {event.completed && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border-transparent px-2 py-0.5 rounded-lg">
                      <CheckCircle size={10} className="mr-1" /> Done
                    </Badge>
                  </motion.div>
                )}
                {event.completed && event.studentsReached !== undefined && (
                  <span className="text-[9px] font-bold text-[#94a3b8]">{event.studentsReached} students</span>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-3">
                  {!event.completed && (
                    <button onClick={() => onMarkDone(event.id)} className="text-[#94a3b8]/30 hover:text-[#10b981] transition-colors" title="Mark Done">
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button onClick={() => onEdit(event)} className="text-[#94a3b8]/30 hover:text-white transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => onDelete(event.id)} className="text-[#94a3b8]/30 hover:text-[#ef4444] transition-colors"><Trash2 size={15} /></button>
                </div>
              )}
            </div>

            {/* Title with text reveal */}
            <h3 className="text-2xl text-white font-sans font-semibold mb-4 leading-tight">
              <AnimatedText text={event.title} delay={index * 0.1 + 0.3} />
            </h3>

            {/* Meta row */}
            <motion.div
              className="flex items-center gap-5 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 text-[#94a3b8]">
                <Clock size={13} style={{ color: catColor }} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#94a3b8]">
                <MapPin size={13} className="text-[#00875a]" />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px]">{event.location}</span>
              </div>
            </motion.div>

            {/* Description with typewriter */}
            <div className="text-[#94a3b8] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
              <TypewriterText text={event.description} delay={index * 0.1 + 600} speed={15} />
            </div>

            {/* Mark done input */}
            {isAdmin && markingDone === event.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 bg-[#0B0F19] rounded-xl p-4 border border-[#1F2A3F] mb-4"
              >
                <input type="number" min="0" placeholder="Students reached" value={studentCount} onChange={e => onStudentCountChange(e.target.value)}
                  className="flex-1 bg-[#161F30] p-3 rounded-lg outline-none border-2 border-transparent focus:border-[#00f59b] font-bold text-white text-sm transition-all placeholder:text-[#94a3b8]/30" autoFocus />
                <button onClick={() => onConfirmDone(event.id)} className="px-4 py-3 bg-[#10b981] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all">Confirm</button>
                <button onClick={onCancelDone} className="px-4 py-3 bg-[#1F2A3F] text-[#94a3b8] rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-[#00f59b] transition-all">Cancel</button>
              </motion.div>
            )}

            {/* ICS download */}
            <motion.button
              onClick={() => onDownloadICS(event)}
              className="flex items-center gap-2 text-[#94a3b8]/30 hover:text-[#00f59b] transition-all group/btn mt-auto"
              whileHover={{ x: 4 }}
            >
              <Calendar size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add to Calendar</span>
              <ChevronRight size={12} className="opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0 transition-all" />
            </motion.button>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
