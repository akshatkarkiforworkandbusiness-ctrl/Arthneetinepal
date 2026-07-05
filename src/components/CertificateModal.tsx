import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleId: string;
}

export default function CertificateModal({ isOpen, onClose, moduleTitle, moduleId }: CertificateModalProps) {
  const { user } = useAuth();
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    if (!user) return;
    try {
      const shareUrl = `${window.location.origin}/certificate/${user.uid}/${moduleId}`;
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop - hide when printing */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden" 
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl z-10"
        >
          {/* Controls - hide when printing */}
          <div className="flex justify-end gap-4 mb-4 print:hidden">
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-[#003893] text-white text-xs font-black uppercase tracking-widest rounded hover:bg-[#002f80] transition-colors"
            >
              {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
              {isCopied ? "Copied!" : "Copy Share Link"}
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-royal text-white text-xs font-black uppercase tracking-widest rounded hover:bg-royal-light transition-colors"
            >
              <Download size={16} /> Save as PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Certificate Body - this is what gets printed */}
          <div 
            id="certificate-container"
            className="w-full aspect-[1.414/1] bg-white text-slate-900 p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center shadow-2xl print:shadow-none print:p-0 print:w-[297mm] print:h-[210mm] print:m-0"
          >
            {/* Border Design */}
            <div className="absolute inset-4 border-4 border-slate-900/10 pointer-events-none" />
            <div className="absolute inset-6 border border-slate-900/5 pointer-events-none" />
            
            {/* Header */}
            <div className="mt-8 mb-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center font-display italic text-3xl mb-4">
                A
              </div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
                Arthneeti Academy
              </h1>
            </div>

            {/* Title */}
            <h2 className="text-5xl md:text-6xl font-display italic text-slate-900 mb-8">
              Certificate of Completion
            </h2>

            <p className="text-sm font-sans text-slate-500 mb-4 uppercase tracking-widest">
              This is to certify that
            </p>

            {/* User Name */}
            <h3 className="text-4xl font-semibold font-sans text-royal border-b-2 border-royal/30 pb-2 mb-8 px-12 inline-block">
              {user?.displayName || user?.email?.split('@')[0] || 'Arthneeti Scholar'}
            </h3>

            <p className="text-sm font-sans text-slate-500 mb-4 max-w-lg leading-relaxed">
              has successfully completed all required lessons, quizzes, and modules for the comprehensive short course:
            </p>

            {/* Module Name */}
            <h4 className="text-2xl font-bold font-sans text-slate-800 mb-16">
              {moduleTitle}
            </h4>

            {/* Footer Signatures */}
            <div className="mt-auto w-full flex justify-between items-end px-12">
              <div className="flex flex-col items-center">
                <div className="w-40 border-b border-slate-300 pb-2 mb-2 text-center">
                  <span className="font-display italic text-2xl text-slate-700">Arthneeti</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Arthneeti Education Board
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-40 border-b border-slate-300 pb-2 mb-2 text-center text-sm font-bold text-slate-700">
                  {dateStr}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Date of Completion
                </span>
              </div>
            </div>

            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-display italic text-slate-900/[0.02] pointer-events-none select-none">
              A
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
