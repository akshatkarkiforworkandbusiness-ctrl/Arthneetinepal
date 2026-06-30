import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-base text-white py-20 px-6 md:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-xs">
          <Link to="/" className="flex flex-col items-start font-sans tracking-tight font-semibold leading-none mb-8">
            <span className="text-2xl font-black text-white tracking-widest">ARTHNEETI</span>
            <span className="text-sm font-medium text-electric-mint ml-0.5">अर्थनीति</span>
          </Link>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-loose">
            Nepal's student-led movement for financial intelligence. <br />
            Think Big. Invest Smart. Lead Nepal.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-electric-mint mb-6">Explore</h4>
            <div className="flex flex-col gap-4">
              <Link to="/discover" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Discover</Link>
              <Link to="/about-us" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">About Us</Link>
              <Link to="/community" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Community</Link>
              <Link to="/events" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Events</Link>
              <Link to="/learn" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Learn</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-club-green mb-6">Inquiries</h4>
            <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
              <p>learnarthneeti@gmail.com</p>
              <p>9866898759</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">© 2025 Arthneeti. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-electric-mint">Privacy Policy</a>
          <a href="#" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-club-green">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
