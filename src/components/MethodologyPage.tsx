import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Database, BookOpen, Sparkles, TrendingUp, AlertTriangle, Mail, ShieldCheck,
} from 'lucide-react';

/* Public methodology page — what Arthneeti publishes, where it comes from,
 * and what it deliberately is not. Mirrors arthneeti.com's /methodology
 * trust page, but every claim here describes the systems that actually
 * exist in this codebase (see api/news.ts, src/lib/nepseApi.ts,
 * scripts/seedFirestore.ts). If a pipeline changes, update this page. */

const sections = [
  {
    icon: <BookOpen size={20} />,
    title: 'Learning Content',
    content:
      'Our curriculum is written and reviewed by the Arthneeti team. Every lesson traces back to primary sources — Nepal Rastra Bank publications, NEPSE rules and rulebooks, SEBON circulars, and the national budget.',
    items: [
      'Lessons cover NEPSE mechanics, IPOs, mutual funds, banking fundamentals, monetary policy and personal finance for Nepal.',
      'Each lesson lists its own sources in the "Resources" section, so you can verify any figure yourself.',
      'Quiz answers match the lesson text exactly — we test comprehension, not opinion.',
      'When rules change (IPO allotment, margin limits, tax rates), we update the lesson and note the change.',
    ],
  },
  {
    icon: <TrendingUp size={20} />,
    title: 'Market Data',
    content:
      'Live NEPSE indices and top shares come from the YONEPSE public data feed, refreshed on a 30-second cache.',
    items: [
      'Source: the YONEPSE project’s public JSON endpoints (nepalstock.com data, mirrored).',
      'Indices, sub-indices and top-traded shares are shown with a "Live"/"Delayed" badge.',
      'When the feed is unreachable we fall back to the last known snapshot — never invented numbers.',
      'This is a free public mirror, not an official NEPSE API. For trading decisions, confirm on nepalstock.com.',
    ],
  },
  {
    icon: <Sparkles size={20} />,
    title: 'AI-Assisted Research Feed',
    content:
      'Our research feed and daily digest are AI-assisted study material — clearly labelled, source-pooled, and never presented as live reporting.',
    items: [
      'Items are EXAMPLE scenarios that illustrate how a sector behaves (policy reviews, dividend announcements, listings). They are not breaking news.',
      'The model is instructed not to invent specific figures, percentages, profits or exact dates.',
      'Sources named in each item (NEPSE, NRB, Sharesansar, Bizmandu) indicate where you would verify the real story.',
      'Every AI-assisted item carries a visible label. If it is not labelled, a human wrote it.',
    ],
  },
  {
    icon: <Database size={20} />,
    title: 'Community Content',
    content:
      'Posts, comments and questions in the community are written by members. They are opinions, not Arthneeti positions.',
    items: [
      'Community posts are user-generated and not fact-checked by us — read them as discussion, not advice.',
      'Seeded and system-generated content is marked as such in the author field.',
      'You can report abusive or misleading content from any post menu.',
    ],
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Trading Simulator',
    content:
      'The trading game uses virtual money (NPR 1,000,000 starting balance) and simulated order matching.',
    items: [
      'No real money, no real orders, no connection to a broker.',
      'Prices evolve from real opening levels, then simulate intraday movement for practice.',
      'Certificates from the simulator reflect practice performance only.',
    ],
  },
  {
    icon: <AlertTriangle size={20} />,
    title: 'What We Deliberately Don’t Do',
    content:
      'Transparency about limits is part of the methodology. Here is what you will never see on Arthneeti:',
    items: [
      'No buy/sell calls, target prices, or "guaranteed returns" — that is investment advice, and we are not licensed for it.',
      'No paid rankings. Leaderboard positions come from activity and quiz scores.',
      'No hidden data. If a number is on the page, its source is named.',
      'No storing of payment cards — the platform is free.',
      'Certificates are course-completion records, not accredited qualifications.',
    ],
  },
  {
    icon: <Mail size={20} />,
    title: 'Corrections & Feedback',
    content:
      'Errors happen. When you spot one, tell us and we will fix it.',
    items: [
      'Email: learnarthneeti@gmail.com — include the page URL and what looks wrong.',
      'Phone/WhatsApp: 9866898759.',
      'Substantive corrections are applied within a few days and reflected in the page.',
      'Suggest a new lesson topic the same way — the curriculum grows from reader requests.',
    ],
  },
];

export default function MethodologyPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pt-28 pb-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight">
                Our Methodology
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            How Arthneeti sources, labels and corrects its content
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mt-6 max-w-3xl">
            Trust in financial content comes from knowing where it came from. This page explains how
            each part of Arthneeti is produced, which sources we rely on, and where the platform
            intentionally stops short.
          </p>
        </div>

        {/* Quick Summary Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 mb-12">
          <h2 className="text-lg font-bold text-emerald-800 mb-3 font-display">In Simple Terms</h2>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>&#8226; Lessons are written by our team from primary sources (NRB, NEPSE, SEBON, budget documents).</li>
            <li>&#8226; Live market data comes from the public YONEPSE feed — not from us.</li>
            <li>&#8226; AI-assisted feed items are labelled study material, never live reporting.</li>
            <li>&#8226; Community posts are member opinions, not Arthneeti positions.</li>
            <li>&#8226; We never give buy/sell calls or promise returns.</li>
            <li>&#8226; Found an error? Email learnarthneeti@gmail.com and we will fix it.</li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="border border-slate-200 rounded-3xl p-8 hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display">{section.title}</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{section.content}</p>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        {/* Contact */}
        <section className="mt-10 border border-slate-200 rounded-3xl p-8 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-3">Questions about this page?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Write to us at{' '}
            <a href="mailto:learnarthneeti@gmail.com" className="text-emerald-600 font-semibold hover:underline">
              learnarthneeti@gmail.com
            </a>{' '}
            or call/WhatsApp{' '}
            <a href="tel:+9779866898759" className="text-emerald-600 font-semibold hover:underline">
              9866898759
            </a>
            . We answer questions about sourcing and corrections personally.
          </p>
        </section>
      </div>
    </motion.main>
  );
}
