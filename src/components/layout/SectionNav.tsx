import { useEffect, useRef, useState, type MouseEvent } from 'react';

export interface SectionNavItem {
  id: string;
  label: string;
}

/**
 * Sticky sub-navigation for the landing page.
 *
 * The landing page is a single ~8000px scroll. Before this existed the only
 * way to reach a feature was to scroll to the very top (menu) or the very
 * bottom (footer). This bar docks directly under the header, so every section
 * is one click away no matter how far down the visitor has travelled.
 *
 * Anchors are plain `<a href="#id">` on purpose: they stay accessible, work
 * without JavaScript, and share the smooth scrolling + header offset defined
 * by `scroll-behavior` / `scroll-padding-top` in index.css.
 */
export default function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    // Treat a section as active once it crosses the header + sub-nav zone.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-160px 0px -55% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active pill centred when the bar scrolls horizontally (mobile).
  // The nav container is scrolled directly — `scrollIntoView` on the pill also
  // scrolls the document (the pill lives in a stuck sticky bar), which cancels
  // an in-flight anchor jump to the section itself.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[data-active="true"]');
    if (!nav || !active) return;
    const left =
      active.getBoundingClientRect().left -
      nav.getBoundingClientRect().left +
      nav.scrollLeft -
      (nav.clientWidth - active.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeId]);

  // Scroll explicitly rather than leaving it to the browser: clicking the pill
  // for the section you are already on would otherwise do nothing.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.history.replaceState) window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="sticky top-16 md:top-20 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <nav
        ref={navRef}
        aria-label="Page sections"
        className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => handleClick(event, item.id)}
              data-active={isActive}
              aria-current={isActive ? 'true' : undefined}
              className={`shrink-0 px-3.5 py-3 text-[11px] font-bold uppercase tracking-widest rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-club-green bg-emerald-50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
