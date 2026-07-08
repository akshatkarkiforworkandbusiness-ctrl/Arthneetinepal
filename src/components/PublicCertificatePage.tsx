import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Printer, Share2, Award, RefreshCw, ChevronLeft, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { fetchStocks } from '../lib/nepseApi';

interface CertificateData {
  uid: string;
  name: string;
  moduleId: string;
  moduleTitle: string;
  score: number;
  completedAt: any;
}

export default function PublicCertificatePage() {
  const { uid, moduleId } = useParams<{ uid: string; moduleId: string }>();
  
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isTopPerformer, setIsTopPerformer] = useState(false);
  const [publicPortfolioEnabled, setPublicPortfolioEnabled] = useState(false);

  useEffect(() => {
    if (!uid || !moduleId) return;

    const fetchCertAndRankings = async () => {
      try {
        // 1. Fetch public certificate doc
        const certRef = doc(db, 'certificates', `${uid}_${moduleId}`);
        const certSnap = await getDoc(certRef);
        
        if (certSnap.exists()) {
          const certData = certSnap.data() as CertificateData;
          setCert(certData);

          // 2. Fetch user profile to check public portfolio setting
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const isPublic = userData.publicPortfolio === true;
            setPublicPortfolioEnabled(isPublic);

            if (isPublic) {
              // 3. Fetch user portfolio to get returns
              const portfolioRef = doc(db, 'portfolios', uid);
              const portfolioSnap = await getDoc(portfolioRef);
              if (portfolioSnap.exists()) {
                const portfolio = portfolioSnap.data();
                
                // Fetch stocks to compute live MTM returns
                const stocksData = await fetchStocks();
                let holdingsValue = 0;
                for (const [sym, pos] of Object.entries(portfolio.holdings as Record<string, { qty: number; avgCost: number }>)) {
                  const stock = stocksData.find(s => s.symbol === sym);
                  const ltp = stock ? stock.ltp : pos.avgCost;
                  holdingsValue += pos.qty * ltp;
                }
                const totalValue = portfolio.cash + holdingsValue;
                const returnPercent = ((totalValue - portfolio.startingCapital) / portfolio.startingCapital) * 100;

                // 4. Fetch latest season leaderboard to compare
                const now = new Date();
                const seasonId = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
                const q = query(
                  collection(db, 'leaderboards'),
                  where('scope', '==', 'national'),
                  where('period', '==', 'season'),
                  orderBy('computedAt', 'desc'),
                  limit(1)
                );
                const leaderboardsSnap = await getDocs(q);
                if (!leaderboardsSnap.empty) {
                  const entries = leaderboardsSnap.docs[0].data().entries as any[];
                  if (entries.length > 0) {
                    // Calculate median return percent
                    const sortedReturns = entries.map(e => e.returnPercent).sort((a, b) => a - b);
                    const mid = Math.floor(sortedReturns.length / 2);
                    const medianReturn = sortedReturns.length % 2 !== 0 
                      ? sortedReturns[mid] 
                      : (sortedReturns[mid - 1] + sortedReturns[mid]) / 2;

                    // Check if user beat the median return
                    if (returnPercent > medianReturn) {
                      setIsTopPerformer(true);
                    }
                  }
                }
              }
            }
          }
        } else {
          setCert(null);
        }
      } catch (error) {
        console.error("Error loading certificate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertAndRankings();
  }, [uid, moduleId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0b] flex items-center justify-center text-white">
        <RefreshCw className="animate-spin text-[#dc143c] mr-3" size={24} />
        <span className="font-bold tracking-widest text-xs uppercase">Loading Certificate...</span>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-[#090a0b] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 backdrop-blur-md">
          <Award className="mx-auto text-[#dc143c] mb-6" size={48} />
          <h2 className="text-2xl font-bold font-display mb-4">Certificate Not Found</h2>
          <p className="text-[#9f9fa0] text-sm mb-8 leading-relaxed">
            We couldn't locate a valid certificate matching this URL. Please verify the link.
          </p>
          <Link to="/" className="inline-flex px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const completedDate = cert.completedAt?.toDate ? cert.completedAt.toDate() : new Date(cert.completedAt);
  const formattedDate = completedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#090a0b] py-32 px-6 flex flex-col items-center justify-center text-white font-sans">
      
      {/* Back button & controls - hide when printing */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
        <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9f9fa0] hover:text-white transition-colors">
          <ChevronLeft size={16} /> Home
        </Link>
        
        <div className="flex gap-4">
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
            {isCopied ? "Copied!" : "Share Link"}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#dc143c] hover:bg-[#b01030] rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
          >
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Shareable Certificate Layout */}
      <div 
        id="certificate-container"
        className="w-full max-w-4xl aspect-[1.414/1] bg-white text-slate-900 p-12 md:p-24 relative overflow-hidden flex flex-col items-center text-center shadow-2xl border-8 border-slate-900/10 print:shadow-none print:p-0 print:border-none print:w-[297mm] print:h-[210mm] print:m-0"
      >
        {/* Corner Ribbon */}
        {isTopPerformer && (
          <div className="absolute top-12 -right-16 w-56 rotate-45 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 border-t border-b border-amber-300 text-white font-sans font-black text-[9px] uppercase tracking-widest py-2.5 shadow-md flex items-center justify-center gap-1">
            <Award size={12} className="animate-spin" /> Top Performer
          </div>
        )}

        {/* Border Design */}
        <div className="absolute inset-4 border-4 border-slate-900/10 pointer-events-none" />
        <div className="absolute inset-6 border border-slate-900/5 pointer-events-none" />
        
        {/* Header */}
        <div className="mt-8 mb-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-display italic text-3xl mb-4 shadow-lg shadow-slate-900/20">
            A
          </div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">
            Arthneeti Academy
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display italic text-slate-900 mb-8">
          Certificate of Completion
        </h2>

        <p className="text-xs font-sans text-slate-400 mb-4 uppercase tracking-widest font-black">
          This is to certify that
        </p>

        {/* User Name */}
        <h3 className="text-3xl md:text-4xl font-semibold font-sans text-[#003893] border-b-2 border-[#003893]/30 pb-2 mb-8 px-12 inline-block">
          {cert.name}
        </h3>

        <p className="text-xs md:text-sm font-sans text-slate-500 mb-4 max-w-lg leading-relaxed">
          has successfully completed all required lessons, quizzes, and modules for the comprehensive short course:
        </p>

        {/* Module Name */}
        <h4 className="text-xl md:text-2xl font-bold font-sans text-slate-800 mb-12">
          {cert.moduleTitle}
        </h4>

        {/* Footer info */}
        <div className="mt-auto w-full border-t border-slate-900/10 pt-8 flex justify-between items-center px-4 font-sans text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <div>
            <span>Verified Date</span>
            <span className="block font-mono text-slate-900 font-bold mt-1">{formattedDate}</span>
          </div>
          <div>
            <span>Credentials Verification ID</span>
            <span className="block font-mono text-slate-900 font-bold mt-1">{uid.substring(0, 8).toUpperCase()}-{moduleId.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
