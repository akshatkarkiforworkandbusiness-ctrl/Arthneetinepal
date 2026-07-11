import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden mt-auto">
      {/* Subtle geometric pattern in footer */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
        {/* Contact info */}
        <div>
          <Link to="/" className="flex flex-col items-start leading-none mb-6">
            <span className="text-2xl font-bold text-white tracking-widest">ARTHNEETI</span>
            <span className="text-xs font-medium text-white/60 ml-0.5 mt-1">अर्थनीति</span>
          </Link>
          <p className="text-white/80 text-sm max-w-sm mb-8 leading-relaxed">
            Nepal's student-led movement for financial intelligence.<br />
            Think Big. Invest Smart. Lead Nepal.
          </p>
          <div className="flex flex-col gap-4">
            <a href="mailto:learnarthneeti@gmail.com" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <Mail size={16} />
              </div>
              <span className="text-sm">learnarthneeti@gmail.com</span>
            </a>
            <a href="tel:9866898759" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                <Phone size={16} />
              </div>
              <span className="text-sm">9866898759</span>
            </a>
          </div>
        </div>

        {/* Explore Links */}
        <div className="flex flex-col md:items-center">
          <div className="w-full md:w-auto">
            <h3 className="text-xl font-bold mb-6">Explore</h3>
            <div className="flex flex-col gap-3">
              {[
                { name: 'Discover', path: '/discover' },
                { name: 'About Us', path: '/about-us' },
                { name: 'Community', path: '/community' },
                { name: 'Events', path: '/events' },
                { name: 'Learn', path: '/learn' },
              ].map(link => (
                <Link key={link.name} to={link.path} className="text-white/70 hover:text-white hover:translate-x-1 transition-all text-sm inline-block">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Instagram CTA */}
        <div className="flex flex-col md:items-end">
          <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 text-center w-full max-w-sm">
            <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">Follow us on Instagram for the latest insights, event announcements, and financial tips.</p>
            <a 
              href="https://instagram.com/ARTHN.EETI"
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/30"
            >
              <Instagram size={18} /> Follow @ARTHN.EETI
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-white/50 text-xs">
        <p>© {new Date().getFullYear()} Arthneeti. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
