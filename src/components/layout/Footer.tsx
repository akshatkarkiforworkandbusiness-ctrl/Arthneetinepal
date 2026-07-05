import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#090a0b] text-white py-20 px-6 md:px-24">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand */}
        <div className="max-w-xs">
          <Link to="/" className="flex flex-col items-start leading-none mb-8">
            <span className="text-base font-bold text-white tracking-[0.15em]">ARTHNEETI</span>
            <span className="text-[9px] font-medium text-[#9f9fa0] ml-0.5 mt-0.5">अर्थनीति</span>
          </Link>
          <p className="text-[#9f9fa0] text-[10px] font-bold uppercase tracking-[0.182em] leading-loose">
            Nepal's student-led movement for financial intelligence. <br />
            Think Big. Invest Smart. Lead Nepal.
          </p>
        </div>
        
        {/* Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <h4 className="tracked-label text-[#847dff] mb-6">Explore</h4>
            <div className="flex flex-col gap-4">
              {[
                { name: 'Discover', path: '/discover' },
                { name: 'About Us', path: '/about-us' },
                { name: 'Community', path: '/community' },
                { name: 'Events', path: '/events' },
                { name: 'Learn', path: '/learn' },
              ].map(link => (
                <Link key={link.name} to={link.path} className="tracked-label text-[#9f9fa0] hover:text-white transition-all">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="tracked-label text-[#847dff] mb-6">Connect</h4>
            <div className="flex flex-col gap-4">
              <a href="mailto:learnarthneeti@gmail.com" className="tracked-label text-[#9f9fa0] hover:text-white transition-all normal-case tracking-normal">
                learnarthneeti@gmail.com
              </a>
              <a href="tel:9866898759" className="tracked-label text-[#9f9fa0] hover:text-white transition-all">
                Call Us
              </a>
              <a href="https://instagram.com/arthn.eeti" target="_blank" rel="noopener noreferrer" className="tracked-label text-[#9f9fa0] hover:text-white transition-all normal-case tracking-normal flex items-center gap-2">
                @arthn.eeti
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1200px] mx-auto mt-20 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/40">
          © 2025 Arthneeti. All rights reserved.
        </p>
        <div className="flex gap-8">
          <a href="#" className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/40 hover:text-[#9f9fa0] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-[10px] font-bold uppercase tracking-[0.182em] text-[#9f9fa0]/40 hover:text-[#9f9fa0] transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
