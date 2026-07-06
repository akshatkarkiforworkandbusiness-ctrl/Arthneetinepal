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
  Workshop: '#847dff',
  Session: '#3b82f6',
  Conference: '#a855f7',
  Meetup: '#f59e0b',
  Webinar: '#06b6d4',
  Other: '#9f9fa0',
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
        <span className="inline-block w-[2px] h-[1em] bg-[#847dff] ml-0.5 animate-pulse align-middle" />
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
  const hasImage = !!event.imageUrl;

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
          className={`relative border border-white/[0.06] rounded-2xl overflow-hidden group h-full flex flex-col ${hasImage ? 'min-h-[420px]' : ''}`}
          style={{
            boxShadow: `0 0 40px ${catColor}08, 0 25px 50px rgba(0,0,0,0.4)`,
            background: hasImage ? 'transparent' : '#090a0b'
          }}
        >
          {/* Glowing top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" style={{ background: `linear-gradient(90deg, transparent, ${catColor}, transparent)` }} />

          {/* Background Image */}
          {hasImage && (
            <div className="absolute inset-0 z-0">
              <motion.img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a0b] via-[#090a0b]/70 to-[#090a0b]/30" />
              <div className="absolute inset-0 bg-[#090a0b]/40 group-hover:bg-[#090a0b]/20 transition-colors duration-500" />
            </div>
          )}

          {/* 3D Header (only when no image) */}
          {!hasImage && (
            <div className="relative h-56 overflow-hidden shrink-0">
              <Suspense fallback={
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0f1011 0%, #090a0b 50%, ${catColor}08 100%)` }} />
              }>
                <CardScene3D color={catColor} category={event.category} />
              </Suspense>
              <div className="absolute inset-0 bg-gradient-to-t from-[#090a0b] via-[#090a0b]/40 to-transparent z-10 pointer-events-none" />
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-20 pointer-events-none">
            <motion.div
              className="bg-[#0f1011]/90 backdrop-blur-md border border-white/[0.06] rounded-xl px-4 py-2.5 text-center pointer-events-auto shadow-lg"
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

            <motion.div
              className="pointer-events-auto flex items-start gap-2"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
            >
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-transparent px-3 py-1 rounded-lg backdrop-blur-sm shadow-lg" style={{ background: `${catColor}20`, color: catColor }}>
                {event.category}
              </Badge>
              {isAdmin && (
                <div className="flex gap-1 bg-[#0f1011]/90 backdrop-blur-md border border-white/[0.06] rounded-lg px-2 py-1.5 pointer-events-auto shadow-lg">
                  {!event.completed && (
                    <button onClick={() => onMarkDone(event.id)} className="text-[#9f9fa0]/60 hover:text-[#10b981] transition-colors p-1" title="Mark Done">
                      <CheckCircle size={14} />
                    </button>
                  )}
                  <button onClick={() => onEdit(event)} className="text-[#9f9fa0]/60 hover:text-white transition-colors p-1"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(event.id)} className="text-[#9f9fa0]/60 hover:text-[#ef4444] transition-colors p-1"><Trash2 size={14} /></button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className={`p-8 flex flex-col flex-1 relative z-10 ${hasImage ? 'mt-auto' : ''}`}>
            {/* Status */}
            {event.completed && (
              <div className="flex items-center gap-3 mb-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                  <Badge className="text-[9px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border-transparent px-2 py-0.5 rounded-lg">
                    <CheckCircle size={10} className="mr-1" /> Done
                  </Badge>
                </motion.div>
                {event.studentsReached !== undefined && (
                  <span className="text-[9px] font-bold text-[#9f9fa0]">{event.studentsReached} students</span>
                )}
              </div>
            )}

            {/* Title with text reveal */}
            <h3 className={`text-white font-sans font-semibold mb-4 leading-tight ${hasImage ? 'text-2xl' : 'text-2xl'}`}>
              <AnimatedText text={event.title} delay={index * 0.1 + 0.3} />
            </h3>

            {/* Meta row */}
            <motion.div
              className="flex items-center gap-5 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 text-[#9f9fa0]">
                <Clock size={13} style={{ color: catColor }} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#9f9fa0]">
                <MapPin size={13} className="text-[#847dff]" />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px]">{event.location}</span>
              </div>
            </motion.div>

            {/* Description with typewriter */}
            <div className="text-[#9f9fa0] text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
              <TypewriterText text={event.description} delay={index * 0.1 + 600} speed={15} />
            </div>

            {/* Mark done input */}
            {isAdmin && markingDone === event.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 bg-[#0f1011] rounded-xl p-4 border border-white/[0.06] mb-4"
              >
                <input type="number" min="0" placeholder="Students reached" value={studentCount} onChange={e => onStudentCountChange(e.target.value)}
                  className="flex-1 bg-[#161F30] p-3 rounded-lg outline-none border-2 border-transparent focus:border-[#00f59b] font-bold text-white text-sm transition-all placeholder:text-[#9f9fa0]/30" autoFocus />
                <button onClick={() => onConfirmDone(event.id)} className="px-4 py-3 bg-[#10b981] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] transition-all">Confirm</button>
                <button onClick={onCancelDone} className="px-4 py-3 bg-[#1F2A3F] text-[#9f9fa0] rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-[#00f59b] transition-all">Cancel</button>
              </motion.div>
            )}

            {/* ICS download */}
            <motion.button
              onClick={() => onDownloadICS(event)}
              className="flex items-center gap-2 text-[#9f9fa0]/40 hover:text-[#00f59b] transition-all group/btn mt-auto"
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
