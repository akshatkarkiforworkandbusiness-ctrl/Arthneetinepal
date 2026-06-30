import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ChevronDown, Clock, AlertTriangle, FileWarning,
  Shield, Globe, Activity, Lock, Check, FileCheck, Award,
  LayoutDashboard, CreditCard, Users, BarChart3, Settings
} from 'lucide-react';
import { PrecisionFade } from './animations/PrecisionFade';
import { CountUp } from './animations/CountUp';
import { ChartReveal } from './animations/ChartReveal';
import { LayerStack } from './animations/LayerStack';
import { FloatParallax } from './animations/FloatParallax';

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground font-sans antialiased text-[15px] leading-relaxed">
      
      {/* 2. HERO */}
      <section className="relative min-h-[90vh] w-full overflow-hidden bg-background pt-24 md:pt-28 pb-32">
        <div className="absolute inset-0 gradient-mesh opacity-80" />
        <div className="absolute inset-0 grid-precise" style={{maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'}} />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 text-center">
          <PrecisionFade delay={0}>
            <div className="status-badge status-badge-accent inline-flex mb-8">
              <span className="dot dot-pulse bg-accent" />
              <span>Now live in 14 new colleges</span>
              <span className="ml-1">→</span>
            </div>
          </PrecisionFade>
          
          <PrecisionFade delay={0.1}>
            <h1 className="font-sans font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.035em] text-foreground max-w-4xl mx-auto">
              Infrastructure for the next generation of <span className="text-accent">financial</span> leaders.
            </h1>
          </PrecisionFade>

          <PrecisionFade delay={0.2}>
            <p className="mt-6 font-sans text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Financial education, fundamental analysis, and market intelligence. Trusted by future leaders and students to navigate Nepal's complex financial landscape with precision.
            </p>
          </PrecisionFade>

          <PrecisionFade delay={0.3}>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <Link to="/discover" className="bg-foreground text-background rounded-lg px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors">
                Join the Movement <ArrowRight size={16} />
              </Link>
              <Link to="/about-us" className="bg-white border border-border rounded-lg px-5 py-3 text-sm font-semibold text-foreground inline-flex items-center gap-2 hover:border-muted-foreground transition-colors">
                Explore curriculum
              </Link>
            </div>
          </PrecisionFade>

          <PrecisionFade delay={0.4}>
            <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
              {['NEPSE Analysis', 'Fundamental Valuations', 'Macro Economics', 'Policy Research'].map((badge) => (
                <div key={badge} className="status-badge inline-flex">
                  {badge}
                </div>
              ))}
            </div>
          </PrecisionFade>

          {/* Product Visual / Dashboard Mockup */}
          <FloatParallax offset={20} className="relative max-w-6xl mx-auto mt-20 px-6 md:px-8 hidden sm:block">
            <div className="elevation-card rounded-xl overflow-hidden bg-background text-left">
              {/* Browser Chrome */}
              <div className="px-4 py-3 bg-muted border-b border-border flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md font-mono text-xs text-muted-foreground max-w-md">
                  app.arthneeti.com/dashboard
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] h-[500px] md:h-[560px]">
                {/* Sidebar */}
                <div className="hidden md:block bg-background border-r border-border p-4 space-y-1 text-sm">
                  {[
                    { icon: LayoutDashboard, label: 'Dashboard', active: true },
                    { icon: BarChart3, label: 'Market Data' },
                    { icon: Users, label: 'Community' },
                    { icon: CreditCard, label: 'Research' },
                    { icon: Settings, label: 'Settings' }
                  ].map((item) => (
                    <div key={item.label} className={`px-3 py-2 rounded-md flex items-center gap-2.5 font-medium cursor-default ${item.active ? 'bg-accent/8 text-accent' : 'text-muted-foreground hover:bg-muted'}`}>
                      <item.icon size={16} />
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Main Area */}
                <div className="p-6 overflow-hidden bg-background flex flex-col">
                  <div className="flex justify-between items-center">
                    <h2 className="font-sans font-bold text-lg">Market overview</h2>
                    <div className="status-badge inline-flex">Trailing 30 days</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                      { label: 'NEPSE INDEX', value: 2154, prefix: '', suffix: '', change: '+2.4%', color: 'success' },
                      { label: 'COMMUNITY MEMBERS', value: 12450, prefix: '', suffix: '', change: '+12.4%', color: 'success' },
                      { label: 'REPORTS PUBLISHED', value: 89, prefix: '', suffix: '', change: 'Consistent', color: 'muted-foreground' }
                    ].map((stat, i) => (
                      <div key={i} className="elevation-card p-4">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                        <div className="mt-2 font-mono font-bold text-2xl text-foreground">
                          <CountUp end={stat.value} duration={2000} prefix={stat.prefix} suffix={stat.suffix} />
                        </div>
                        <div className={`mt-1 text-xs text-${stat.color} font-mono`}>
                          ↗ {stat.change} vs last period
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 elevation-card p-5 h-56 flex-shrink-0 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-sans font-medium text-sm">Volume vs Engagement</div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono"><div className="w-2 h-2 bg-accent rounded-full"/> Index</div>
                        <div className="flex items-center gap-2 text-xs font-mono"><div className="w-2 h-2 bg-[hsl(var(--chart-3))] rounded-full"/> Active Users</div>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <ChartReveal>
                        {/* Grid lines */}
                        <path d="M0 20 L800 20 M0 60 L800 60 M0 100 L800 100 M0 140 L800 140" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
                        {/* Cyan Line */}
                        <path d="M0 120 Q 100 100 200 110 T 400 90 T 600 80 T 800 60" fill="none" stroke="hsl(var(--chart-3))" strokeWidth="2" />
                        {/* Indigo Line */}
                        <path d="M0 140 Q 150 130 250 80 T 450 60 T 650 40 T 800 20" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" />
                      </ChartReveal>
                    </div>
                  </div>

                  <div className="mt-6 elevation-card p-0 overflow-hidden flex-1">
                    <div className="grid grid-cols-4 px-4 py-2 bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <div>ID</div>
                      <div>Status</div>
                      <div>Metric</div>
                      <div>Timestamp</div>
                    </div>
                    {[
                      { id: 'rpt_8K3pN2', status: 'Published', amount: '12.4k views', time: '10:42 AM' },
                      { id: 'usr_9M4qL1', status: 'Pending', amount: 'Registration', time: '09:15 AM' },
                      { id: 'mkt_2A1bC3', status: 'Updated', amount: 'Index data', time: '08:30 AM' },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-4 px-4 py-3 border-t border-border items-center text-sm hover:bg-muted/30 transition-colors">
                        <div className="font-mono text-xs text-muted-foreground">{row.id}</div>
                        <div>
                          <span className={`status-badge ${row.status === 'Published' ? 'status-badge-success' : 'status-badge-accent'}`}>
                            {row.status}
                          </span>
                        </div>
                        <div className="font-mono font-medium">{row.amount}</div>
                        <div className="text-muted-foreground text-xs">{row.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatParallax>
        </div>
      </section>

      {/* 3. PROBLEM / PAIN */}
      <section className="bg-background py-24 md:py-32 px-6 md:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="status-badge inline-flex mb-6">The problem</div>
            <PrecisionFade>
              <h2 className="font-sans font-bold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.03em] text-foreground max-w-4xl mx-auto">
                Financial literacy shouldn't be a luxury.
              </h2>
            </PrecisionFade>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Clock,
                title: "Information lag.",
                body: "Traditional news outlets report on the market hours after it closes. Your understanding of macroeconomics is delayed, costing you critical market opportunities.",
                stat: "72h",
                statLabel: "typical delay in context"
              },
              {
                icon: AlertTriangle,
                title: "Complexity barrier.",
                body: "Monetary policies, balance sheets, and technical analysis are gatekept by jargon. In-house learning is fragmented and lacks structured curriculum.",
                stat: "90%",
                statLabel: "retail investors lose money"
              },
              {
                icon: FileWarning,
                title: "Fragmented analysis.",
                body: "Multiple sources, conflicting opinions, and biased recommendations. A single bad source breaks your investment thesis and portfolio operation.",
                stat: "6+",
                statLabel: "sources to reconcile"
              }
            ].map((item, i) => (
              <LayerStack key={i} index={i} className="elevation-card p-7 space-y-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <item.icon size={16} className="text-muted-foreground" />
                </div>
                <h3 className="font-sans font-semibold text-base text-foreground">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                <div className="pt-3 border-t border-border flex items-baseline gap-2">
                  <span className="font-mono font-semibold text-lg text-foreground">{item.stat}</span>
                  <span className="font-sans text-xs text-muted-foreground">{item.statLabel}</span>
                </div>
              </LayerStack>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SOLUTION / FEATURES */}
      <section className="bg-[#0A1628] text-background py-24 md:py-36 px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '56px 56px'}} />
        <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(67, 56, 202, 0.15), transparent 60%)'}} />

        <div className="max-w-7xl mx-auto text-center mb-20 relative z-10">
          <div className="status-badge inline-flex mb-6 bg-white/5 border-white/10 text-white/80">
            <span className="dot bg-accent dot-pulse" /> The platform
          </div>
          <PrecisionFade>
            <h2 className="mt-6 font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.035em] max-w-4xl mx-auto">
              One platform. Every financial concept you need.
            </h2>
          </PrecisionFade>
          <p className="mt-6 font-sans text-base md:text-lg text-background/70 max-w-2xl mx-auto leading-relaxed">
            Arthneeti unifies financial education behind a single rigorous curriculum, a single community dashboard, and a single analytical framework.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
          {/* Large Card */}
          <div className="lg:col-span-4 frosted-glass-dark rounded-xl p-8 md:p-10 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="status-badge bg-white/5 border-white/10 text-white/80 inline-flex">
                Primitive 01 / Market API
              </div>
              <h3 className="mt-5 font-sans font-bold text-2xl md:text-3xl leading-tight">
                Analyze markets with a single data stream.
              </h3>
              <p className="mt-4 font-sans text-sm text-background/70 max-w-md leading-relaxed">
                Fundamental screening, technical indicators, macro economic data across all NEPSE sectors. One interface. One analytical pipeline.
              </p>
            </div>
            
            <div className="mt-8 bg-[#0A1628] border border-white/10 rounded-lg p-4">
              <div className="font-mono text-xs text-white/50 mb-3">api.arthneeti.com/v2/market</div>
              <div className="font-mono text-xs text-background/90 leading-relaxed space-y-1">
                <div className="text-white/50">// Fetch fundamental data</div>
                <div><span className="text-[#818CF8]">const</span> data = <span className="text-[#818CF8]">await</span> arthneeti.markets.<span className="text-[#06B6D4]">analyze</span>(&#123;</div>
                <div>  ticker: <span className="text-[#FBBF24]">'NABIL'</span>,</div>
                <div>  metrics: [<span className="text-[#FBBF24]">'PE'</span>, <span className="text-[#FBBF24]">'PB'</span>, <span className="text-[#FBBF24]">'ROE'</span>],</div>
                <div>  timeline: <span className="text-[#FBBF24]">'5Y'</span></div>
                <div>&#125;);</div>
              </div>
            </div>
          </div>

          {/* Small Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="frosted-glass-dark rounded-xl p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center">
                <Shield size={14} className="text-accent" />
              </div>
              <h4 className="font-sans font-semibold text-base text-background">Unbiased, embedded.</h4>
              <p className="font-sans text-sm text-background/60 leading-snug">Strict editorial guidelines. No pump and dump. Academic rigor ships by default.</p>
            </div>
            <div className="frosted-glass-dark rounded-xl p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center">
                <Globe size={14} className="text-accent" />
              </div>
              <h4 className="font-sans font-semibold text-base text-background">Macro by default.</h4>
              <p className="font-sans text-sm text-background/60 leading-snug">Connect local NEPSE movements to global economic shifts and interest rate cycles.</p>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="frosted-glass-dark rounded-xl p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center">
                <Activity size={14} className="text-accent" />
              </div>
              <h4 className="font-sans font-semibold text-base text-background">Live community.</h4>
              <p className="font-sans text-sm text-background/60 leading-snug">Every thesis debated in real time. No echo chambers, no delayed moderation.</p>
            </div>
            <div className="frosted-glass-dark rounded-xl p-6 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center">
                <Lock size={14} className="text-accent" />
              </div>
              <h4 className="font-sans font-semibold text-base text-background">Private intellect.</h4>
              <p className="font-sans text-sm text-background/60 leading-snug">Your portfolios and watchlists never leave your environment unencrypted. Complete privacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. METRICS ROW */}
      <section className="bg-background py-20 md:py-24 px-6 md:px-8 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
            Real impact from real community
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
            <div className="text-center md:border-r md:border-border md:px-4">
              <div className="font-mono font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-none">
                <CountUp end={12} suffix="K+" duration={2000} />
              </div>
              <div className="mt-3 font-sans text-sm text-muted-foreground font-medium max-w-[180px] mx-auto">
                Students educated annually
              </div>
            </div>
            <div className="text-center md:border-r md:border-border md:px-4">
              <div className="font-mono font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-none">
                <CountUp end={95} suffix="%" duration={2000} />
              </div>
              <div className="mt-3 font-sans text-sm text-muted-foreground font-medium max-w-[180px] mx-auto">
                Information accuracy rate
              </div>
            </div>
            <div className="text-center md:border-r md:border-border md:px-4">
              <div className="font-mono font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-none">
                <CountUp end={50} prefix="<" suffix="ms" duration={2000} />
              </div>
              <div className="mt-3 font-sans text-sm text-muted-foreground font-medium max-w-[180px] mx-auto">
                Median platform response time
              </div>
            </div>
            <div className="text-center md:px-4">
              <div className="font-mono font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-none">
                <CountUp end={24} suffix="/7" duration={2000} />
              </div>
              <div className="mt-3 font-sans text-sm text-muted-foreground font-medium max-w-[180px] mx-auto">
                Active market discussions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS / INTEGRATION */}
      <section className="bg-background py-24 md:py-32 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="status-badge inline-flex mb-6">Integration</div>
            <PrecisionFade>
              <h2 className="font-sans font-bold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.03em] text-center max-w-3xl mx-auto">
                From beginner to analyst in 14 weeks, not 14 years.
              </h2>
            </PrecisionFade>
          </div>

          <div className="mt-16 grid md:grid-cols-4 gap-4">
            {[
              {
                num: "01", time: "Weeks 01 — 03", title: "Fundamentals.", body: "Your journey starts with core economics. We review macro factors, banking systems, and baseline terminology.",
                checks: ["Core economics", "Financial terminology", "Market structure"]
              },
              {
                num: "02", time: "Weeks 04 — 07", title: "Technical setup.", body: "Read balance sheets, understand income statements, and learn cash flow modeling.",
                checks: ["Balance sheets", "Income statements", "Cash flow models"]
              },
              {
                num: "03", time: "Weeks 08 — 11", title: "Market readiness.", body: "We review technical indicators, volume analysis, and sentiment reading.",
                checks: ["Technical indicators", "Volume analysis", "Sentiment reading"]
              },
              {
                num: "04", time: "Weeks 12 — 14", title: "Go live.", body: "Build your first portfolio. Gradual deployment with real-time feedback from our community.",
                checks: ["Portfolio construction", "Risk management", "Live feedback"]
              }
            ].map((stage, i) => (
              <LayerStack key={i} index={i} className="elevation-card p-6 space-y-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent font-mono font-bold text-sm flex items-center justify-center">
                    {stage.num}
                  </div>
                  <div className="status-badge inline-flex">{stage.time}</div>
                </div>
                <h3 className="font-sans font-semibold text-lg text-foreground leading-tight">{stage.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">{stage.body}</p>
                <div className="mt-4 space-y-2 pt-4 border-t border-border">
                  {stage.checks.map(check => (
                    <div key={check} className="flex items-start gap-2 font-sans text-xs text-foreground">
                      <Check size={14} className="text-success flex-shrink-0 mt-0.5" />
                      {check}
                    </div>
                  ))}
                </div>
              </LayerStack>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SOCIAL PROOF / CASE STUDIES */}
      <section className="bg-background py-24 md:py-32 px-6 md:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="status-badge inline-flex mb-6">Network</div>
            <PrecisionFade>
              <h2 className="font-sans font-bold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.03em] text-center max-w-3xl mx-auto">
                Powering financial acumen at institutions that define the category.
              </h2>
            </PrecisionFade>
          </div>

          <div className="mt-14 grid grid-cols-3 md:grid-cols-6 gap-px bg-border overflow-hidden rounded-xl">
            {['Apex College', 'KUSOM', 'KCM', 'Shanker Dev', 'Nabil Bank', 'NIC Asia'].map(logo => (
              <div key={logo} className="bg-background p-8 flex items-center justify-center">
                <span className="font-sans font-semibold text-base text-muted-foreground">{logo}</span>
              </div>
            ))}
          </div>

          <div className="mt-20 elevation-card p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 pb-6 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold">K</div>
                <span className="font-sans font-bold text-lg text-foreground">Kathmandu University</span>
              </div>
              <p className="mt-6 font-sans text-xl md:text-2xl text-foreground leading-[1.4] font-medium">
                "We replaced scattered seminars and outdated textbooks with Arthneeti in under a month. Our students got 40% deeper insights into real-world market operations."
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                   <Users className="text-muted-foreground" size={20}/>
                </div>
                <div>
                  <div className="font-sans font-semibold text-sm">Dr. Sharma</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">Professor of Finance</div>
                </div>
              </div>
              <Link to="/about-us" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:gap-3 transition-all">
                Read the full case study <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { val: '98.7%', sub: 'Reduction in basic queries', ctx: 'First 90 days post-integration' },
                { val: '2.4x', sub: 'Increase in logical reasoning', ctx: 'After curriculum consolidation' },
                { val: '14 days', sub: 'Time to baseline competence', ctx: 'From sign-up to first analysis' }
              ].map((stat, i) => (
                <div key={i} className="bg-muted/50 border border-border rounded-lg p-5">
                  <div className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-medium">{stat.sub}</div>
                  <div className="mt-2 font-mono font-bold text-3xl text-foreground">{stat.val}</div>
                  <div className="mt-2 font-sans text-xs text-muted-foreground">{stat.ctx}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. ABOUT / LEADERSHIP */}
      <section className="bg-background py-24 md:py-32 px-6 md:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="status-badge inline-flex mb-6">The team</div>
            <PrecisionFade>
              <h2 className="font-sans font-bold text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.03em] text-center max-w-3xl mx-auto">
                Built by students who understand the future of financial infrastructure.
              </h2>
            </PrecisionFade>
          </div>

          <div className="mt-16 grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-7">
              <div className="space-y-5 font-sans text-base md:text-lg text-foreground/80 leading-relaxed max-w-2xl">
                <p>
                  Arthneeti was founded by students and financial enthusiasts who previously navigated the complexities of NEPSE, central bank policies, and raw financial modeling. We came together to solve the one problem we kept seeing: even the best financial knowledge in Nepal is still too hard to find, too slow to verify, and too fragmented to learn cleanly.
                </p>
                <p>
                  Today we serve future leaders and students in the financial sector, with education distributed across the country. We are building for the long term and aim to establish a universally accessible standard of financial intelligence.
                </p>
              </div>

              <div className="mt-10 flex items-center gap-6 flex-wrap">
                <div className="font-sans text-xs uppercase tracking-wider text-muted-foreground font-medium">Core contributors from</div>
                <div className="font-sans font-semibold text-sm text-foreground">Apex</div>
                <div className="font-sans font-semibold text-sm text-foreground">KUSOM</div>
                <div className="font-sans font-semibold text-sm text-foreground">Shanker Dev</div>
                <div className="font-sans font-semibold text-sm text-foreground">KCM</div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="font-sans font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Curriculum standards
              </div>
              <div className="space-y-3">
                {[
                  { icon: Shield, title: 'Unbiased Curriculum', ctx: 'Reviewed periodically by experts' },
                  { icon: FileCheck, title: 'Data Integrity', ctx: 'Cross-verified NEPSE reports' },
                  { icon: Lock, title: 'Privacy First', ctx: 'Student data management compliant' },
                  { icon: Award, title: 'Academic Rigor', ctx: 'University-level depth' }
                ].map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                    <cert.icon size={16} className="text-success" />
                    <div>
                      <div className="font-sans font-semibold text-sm text-foreground">{cert.title}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-0.5">{cert.ctx}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="bg-background py-24 md:py-32 px-6 md:px-8 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="elevation-card bg-foreground text-background rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(67, 56, 202, 0.25), transparent 70%)'}} />
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'}} />
            
            <div className="relative z-10">
              <div className="status-badge inline-flex mb-6 bg-white/10 border-white/20 text-background">
                <span className="dot bg-accent dot-pulse" /> Ready when you are
              </div>
              <PrecisionFade>
                <h2 className="font-sans font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.035em]">
                  Ship financial intelligence that <span className="text-accent">works.</span>
                </h2>
              </PrecisionFade>
              <p className="mt-6 font-sans text-base md:text-lg text-background/70 max-w-xl mx-auto leading-relaxed">
                Join our community to access resources, discussions, and the network. Direct access to a community that's building the future of Nepal's market.
              </p>
              
              <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
                <Link to="/discover" className="bg-background text-foreground rounded-lg px-6 py-3.5 text-sm font-semibold inline-flex items-center gap-2 hover:bg-background/90 transition-colors">
                  Join the Movement <ArrowRight size={16} />
                </Link>
                <Link to="/about-us" className="bg-transparent border border-white/20 rounded-lg px-6 py-3.5 text-sm font-semibold text-background inline-flex items-center gap-2 hover:bg-white/5 transition-colors">
                  Read the manifesto
                </Link>
              </div>

              <div className="mt-8 font-mono text-xs text-background/50 tracking-wide">
                100% Free / Unbiased Research / Community Driven
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
