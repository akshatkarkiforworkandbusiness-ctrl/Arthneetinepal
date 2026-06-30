import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-16 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          
          {/* Brand Block */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-3 h-3 border-2 border-background rounded-sm rotate-45" />
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-foreground">
                Arthneeti
              </span>
            </Link>
            <p className="font-sans text-sm text-muted-foreground max-w-xs leading-relaxed">
              Financial education, fundamental analysis, and market intelligence for future leaders and students.
            </p>
            <div className="mt-6 status-badge status-badge-success inline-flex">
              <span className="dot dot-pulse bg-success" /> All systems operational
            </div>
            <div className="mt-4 font-mono text-xs text-muted-foreground">
              Platform v2.8.1 / Updated 2 hours ago
            </div>
          </div>

          {/* Nav Columns */}
          <div className="col-span-1">
            <h4 className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">Academy</h4>
            <div className="space-y-2.5 font-sans text-sm text-foreground flex flex-col">
              <Link to="/learn" className="hover:text-accent transition-colors">Curriculum</Link>
              <Link to="/research" className="hover:text-accent transition-colors">Market Research</Link>
              <Link to="/analysis" className="hover:text-accent transition-colors">Valuations</Link>
              <Link to="/policy" className="hover:text-accent transition-colors">NRB Policies</Link>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">Community</h4>
            <div className="space-y-2.5 font-sans text-sm text-foreground flex flex-col">
              <Link to="/community" className="hover:text-accent transition-colors">Discussions</Link>
              <Link to="/events" className="hover:text-accent transition-colors">Events</Link>
              <Link to="/guidelines" className="hover:text-accent transition-colors">Guidelines</Link>
              <Link to="/ambassadors" className="hover:text-accent transition-colors">Ambassadors</Link>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">Organization</h4>
            <div className="space-y-2.5 font-sans text-sm text-foreground flex flex-col">
              <Link to="/about-us" className="hover:text-accent transition-colors">About</Link>
              <Link to="/partners" className="hover:text-accent transition-colors">Partners</Link>
              <Link to="/careers" className="hover:text-accent transition-colors">Careers</Link>
              <Link to="/contact" className="hover:text-accent transition-colors">Contact</Link>
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">Legal</h4>
            <div className="space-y-2.5 font-sans text-sm text-foreground flex flex-col">
              <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
              <Link to="/security" className="hover:text-accent transition-colors">Security</Link>
              <Link to="/cookies" className="hover:text-accent transition-colors">Cookies</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-sans text-xs text-muted-foreground">
            © 2026 Arthneeti, Inc. All rights reserved.
          </div>
          
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">SOC 2</span>
              <span className="font-mono text-xs text-muted-foreground">ISO 27001</span>
              <span className="font-mono text-xs text-muted-foreground">GDPR</span>
            </div>
            
            <div className="flex items-center gap-1.5 font-sans text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <Globe size={12} />
              <span>English (US)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
