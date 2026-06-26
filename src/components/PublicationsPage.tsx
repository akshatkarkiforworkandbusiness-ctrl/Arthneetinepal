import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { db, auth, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';

interface ArchiveItem {
  id: string;
  title: string;
  author: string;
  category: string;
  date: string;
  abstract: string;
  image: string;
}

interface RigorContent {
  id: string;
  text: string;
  order: number;
}

export default function PublicationsPage() {
  const { user } = useAuth();
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [rigorContent, setRigorContent] = useState<RigorContent[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRigorModal, setShowRigorModal] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [manuscript, setManuscript] = useState({
    name: '',
    institution: '',
    email: '',
    content: '',
    pdf: null as File | null
  });

  const [newRigorText, setNewRigorText] = useState('');

  useEffect(() => {
    const pArchive = 'publications';
    const qArchive = query(collection(db, pArchive), orderBy('createdAt', 'desc'));
    const unsubscribeArchive = onSnapshot(qArchive, 
      (snapshot) => {
        setArchive(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveItem)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pArchive)
    );

    const pRigor = 'rigor_content';
    const qRigor = query(collection(db, pRigor), orderBy('order', 'asc'));
    const unsubscribeRigor = onSnapshot(qRigor, 
      (snapshot) => {
        setRigorContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RigorContent)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, pRigor)
    );

    return () => {
      unsubscribeArchive();
      unsubscribeRigor();
    };
  }, []);

  const handleSubmitManuscript = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'manuscripts';
    setIsUploading(true);
    try {
      let pdfUrl = '';
      if (manuscript.pdf) {
        const pdfRef = ref(storage, `manuscripts/${Date.now()}_${manuscript.pdf.name}`);
        await uploadBytes(pdfRef, manuscript.pdf);
        pdfUrl = await getDownloadURL(pdfRef);
      }

      await addDoc(collection(db, path), {
        name: manuscript.name,
        institution: manuscript.institution,
        email: manuscript.email,
        content: manuscript.content,
        pdfUrl,
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      // Cross-post to Community Feed
      await addDoc(collection(db, 'posts'), {
        title: `Research Submission: ${manuscript.name}`,
        author: manuscript.name,
        authorId: auth.currentUser?.uid || 'anonymous',
        category: 'Policy',
        type: 'research',
        content: manuscript.content,
        abstract: manuscript.content.substring(0, 300) + '...',
        pdfUrl,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });

      setShowSubmitModal(false);
      setManuscript({ name: '', institution: '', email: '', content: '', pdf: null });
      toast.success("Manuscript submitted successfully for review.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Failed to submit manuscript.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddRigor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRigorText) return;
    const path = 'rigor_content';
    try {
      await addDoc(collection(db, path), {
        text: newRigorText,
        order: rigorContent.length,
        createdAt: serverTimestamp()
      });
      setNewRigorText('');
      setShowRigorModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 md:px-12 py-24"
    >
      <header className="mb-24 flex flex-col md:flex-row justify-between items-end gap-12">
        <div className="max-w-3xl">
          <span className="text-[10px] font-black text-electric-mint mb-4 block uppercase tracking-[0.4em]">INSTITUTIONAL ARCHIVE</span>
          <h1 className="font-sans tracking-tight font-semibold text-6xl text-text-primary italic leading-tight mb-8 tracking-tight">Knowledge. Vision. Sovereignty.</h1>
          <p className="text-xl text-text-muted leading-relaxed italic">
            A curated repository of deep economic research and strategic documentation, preserving the intellectual heritage of Nepal's youth movement.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSubmitModal(true)}
            className="px-8 py-5 border-2 border-electric-mint text-electric-mint rounded-lg-2xl text-[10px] font-black uppercase tracking-widest hover:bg-electric-mint hover:text-slate-base transition-all"
          >
            SUBMIT MANUSCRIPT
          </button>
        </div>
      </header>

      <section className="space-y-12 mb-32">
        {archive.length > 0 ? archive.map((paper, i) => (
          <motion.article 
            key={paper.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-lg-[60px] border border-slate-base/10 overflow-hidden flex flex-col lg:flex-row shadow-sm hover:shadow-2xl transition-all duration-700 group"
          >
            <div className="lg:w-2/5 relative overflow-hidden h-80 lg:h-auto">
              <img src={paper.image} alt={paper.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-slate-base/20" />
            </div>
            <div className="lg:w-3/5 p-12 md:p-20 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-10">
                  <Badge variant="outline" className="px-5 py-2 bg-electric-mint/10 text-electric-mint border-transparent rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {paper.category}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-base/30 uppercase tracking-widest">{paper.date}</span>
                </div>
                <h3 className="font-sans tracking-tight font-semibold text-5xl text-slate-base italic mb-8 leading-tight group-hover:text-electric-mint transition-colors tracking-tight">
                  {paper.title}
                </h3>
                <p className="text-lg text-slate-base/60 italic leading-relaxed mb-12">
                  "{paper.abstract}"
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-base/5 pt-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-base border border-surface-high flex items-center justify-center font-bold text-xs text-electric-mint">
                    {paper.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-base">{paper.author}</p>
                    <p className="text-[10px] text-slate-base/40 uppercase font-black tracking-widest">Fellow</p>
                  </div>
                </div>
                <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-base/40 hover:text-electric-mint transition-all">
                  <span className="material-symbols-outlined text-lg">download</span>
                  DOWNLOAD PDF
                </button>
              </div>
            </div>
          </motion.article>
        )) : (
          <div className="text-center py-32 bg-white rounded-lg-[60px] border border-dashed border-electric-mint/20">
            <p className="text-electric-mint/40 italic">The archive is currently empty.</p>
          </div>
        )}
      </section>

      <section className="bg-slate-base text-white p-16 md:p-32 rounded-lg-[80px] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-lg blur-[120px] -mr-48 -mb-48" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-sans tracking-tight font-semibold text-6xl italic leading-tight text-white">Upholding Academic Rigor.</h2>
              {user && (
                <button 
                  onClick={() => setShowRigorModal(true)}
                  className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>
            
            <div className="space-y-8 mb-12">
              {rigorContent.length > 0 ? rigorContent.map(item => (
                <p key={item.id} className="text-xl text-white/70 leading-relaxed italic">
                  {item.text}
                </p>
              )) : (
                <p className="text-xl text-white/40 leading-relaxed italic">
                  Every publication in the Arthneeti Archive undergoes a rigorous peer-review process by our Board of Researchers to ensure objective financial analysis.
                </p>
              )}
            </div>

            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-4xl font-sans tracking-tight font-semibold italic mb-2 text-electric-mint">42+</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Papers Published</p>
              </div>
              <div className="text-center border-l border-white/10 pl-8">
                <p className="text-4xl font-sans tracking-tight font-semibold italic mb-2 text-club-green">1.2k</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Citations</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl p-12 rounded-lg-[48px] border border-white/10">
            <span className="text-[10px] font-black text-electric-mint mb-6 block uppercase tracking-widest">SUBMISSION PORTAL</span>
            <h3 className="font-sans tracking-tight font-semibold text-3xl italic mb-6 text-white">Ready to contribute?</h3>
            <p className="text-base text-white/60 mb-10 leading-relaxed">
              We welcome original research, policy briefs, and market analysis from students and researchers across Nepal.
            </p>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-text-primary text-surface-base py-5 rounded-lg-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-club-green hover:text-white transition-all"
            >
              START SUBMISSION
            </button>
          </div>
        </div>
      </section>

      {/* Manuscript Submission Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubmitModal(false)} className="absolute inset-0 bg-slate-base/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-surface-raised border border-surface-high p-8 md:p-12 rounded-lg-[40px] max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowSubmitModal(false)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="font-sans tracking-tight font-semibold text-4xl italic text-text-primary mb-8">Submit Manuscript</h2>
              <form onSubmit={handleSubmitManuscript} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Full Name</label>
                    <input required type="text" value={manuscript.name} onChange={e => setManuscript({...manuscript, name: e.target.value})} className="w-full bg-surface-base border border-surface-high rounded-lg p-4 text-sm text-text-primary outline-none focus:border-electric-mint transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Institution</label>
                    <input required type="text" value={manuscript.institution} onChange={e => setManuscript({...manuscript, institution: e.target.value})} className="w-full bg-surface-base border border-surface-high rounded-lg p-4 text-sm text-text-primary outline-none focus:border-electric-mint transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Email Address</label>
                    <input required type="email" value={manuscript.email} onChange={e => setManuscript({...manuscript, email: e.target.value})} className="w-full bg-surface-base border border-surface-high rounded-lg p-4 text-sm text-text-primary outline-none focus:border-electric-mint transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Upload PDF Document (Required)</label>
                    <input 
                      required 
                      type="file" 
                      accept=".pdf"
                      onChange={e => setManuscript({...manuscript, pdf: e.target.files?.[0] || null})} 
                      className="w-full text-xs text-text-muted" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Abstract / Content Summary</label>
                  <textarea required value={manuscript.content} onChange={e => setManuscript({...manuscript, content: e.target.value})} className="w-full bg-surface-base border border-surface-high rounded-lg p-4 text-sm text-text-primary outline-none h-40 resize-none focus:border-electric-mint transition-all" />
                </div>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-electric-mint text-slate-base py-4 rounded-lg-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-club-green transition-all shadow-xl disabled:opacity-30"
                >
                  {isUploading ? 'UPLOADING...' : 'SUBMIT FOR REVIEW'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Rigor Content Modal */}
      <AnimatePresence>
        {showRigorModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRigorModal(false)} className="absolute inset-0 bg-slate-base/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-surface-raised p-8 rounded-lg-[40px] max-w-lg w-full shadow-2xl relative">
              <h2 className="font-sans tracking-tight font-semibold text-3xl italic text-text-primary mb-6">Add Rigor Statement</h2>
              <form onSubmit={handleAddRigor} className="space-y-6">
                <textarea required value={newRigorText} onChange={e => setNewRigorText(e.target.value)} className="w-full bg-surface-base border border-surface-high rounded-lg p-4 text-sm text-text-primary outline-none h-32 resize-none focus:border-electric-mint transition-all" placeholder="Statement about academic standards..." />
                <button type="submit" className="w-full bg-electric-mint text-slate-base py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-club-green transition-all">ADD STATEMENT</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
