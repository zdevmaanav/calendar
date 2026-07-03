'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const h = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ── Project data ── */
const row1 = [
  { name: 'EURO INTERNATIONAL SCHOOL', category: 'BRAND IDENTITY & APEX MARKETING', year: '2026', gradient: 'linear-gradient(135deg, rgba(220,215,240,0.5), rgba(255,220,210,0.5))' },
  { name: 'FINTECH REMITTANCE APP', category: 'DIGITAL MARKETING STRATEGY', year: '2025', gradient: 'linear-gradient(135deg, rgba(200,230,240,0.5), rgba(220,215,240,0.4))' },
  { name: 'E-COMMERCE PLATFORM', category: 'SOCIAL MEDIA AUTOMATION', year: '2025', gradient: 'linear-gradient(135deg, rgba(255,220,210,0.5), rgba(220,235,220,0.4))' },
];

const featured = {
  name: 'APEX MARKETING', category: 'SAAS PLATFORM DESIGN & DEVELOPMENT', year: '2026',
  desc: 'THE COMPLETE AI MARKETING AUTOMATION\nPLATFORM. FROM LANDING PAGE TO DASHBOARD.',
  gradient: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(6,182,212,0.06))',
};

const row3 = [
  { name: 'EIS HR AUTOMATION', category: 'WORKFLOW AUTOMATION & AI', year: '2026', gradient: 'linear-gradient(135deg, rgba(232,114,42,0.08), rgba(255,220,210,0.4))' },
  { name: 'TRANSPORT DASHBOARD', category: 'INTERNAL TOOLS & DATA VIZ', year: '2025', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(220,215,240,0.4))' },
];

const stats = [
  { number: '12+', label: 'BRANDS TRANSFORMED' },
  { number: '50K+', label: 'POSTS GENERATED' },
  { number: '3X', label: 'AVERAGE ENGAGEMENT INCREASE' },
];

/* ── Shared label style ── */
const labelStyle: React.CSSProperties = {
  fontFamily: h, fontSize: 11, fontWeight: 400, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)',
};

/* ── Standard project card ── */
function ProjectCard({ name, category, year, gradient, height = 400 }: {
  name: string; category: string; year: string; gradient: string; height?: number;
}) {
  return (
    <div
      className="wk-card"
      style={{
        position: 'relative', height, borderRadius: 12, overflow: 'hidden',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', opacity: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.12)';
        const overlay = e.currentTarget.querySelector('.wk-overlay') as HTMLElement;
        const img = e.currentTarget.querySelector('.wk-img') as HTMLElement;
        if (overlay) overlay.style.opacity = '1';
        if (img) img.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)';
        const overlay = e.currentTarget.querySelector('.wk-overlay') as HTMLElement;
        const img = e.currentTarget.querySelector('.wk-img') as HTMLElement;
        if (overlay) overlay.style.opacity = '0';
        if (img) img.style.transform = 'scale(1)';
      }}
    >
      {/* Image area — 60% */}
      <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
        <div className="wk-img" style={{
          width: '100%', height: '100%', backgroundImage: gradient,
          backgroundColor: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <span style={{ fontFamily: h, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.2)' }}>
            PROJECT IMAGE
          </span>
        </div>
        {/* Hover overlay */}
        <div className="wk-overlay" style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.4s ease', backdropFilter: 'blur(4px)',
        }}>
          <span style={{ fontFamily: h, fontSize: 13, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f3edd4' }}>
            VIEW PROJECT →
          </span>
        </div>
      </div>
      {/* Info area — 40% */}
      <div style={{ flex: '0 0 40%', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontFamily: h, fontSize: 16, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1a1208', marginBottom: 6 }}>
          {name}
        </span>
        <span style={{ fontFamily: h, fontSize: 11, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>
          {category}
        </span>
        <span style={{ fontFamily: h, fontSize: 11, fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>
          {year}
        </span>
      </div>
    </div>
  );
}

export default function WorkPage() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ST: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      ST = ScrollTrigger;

      /* Hero */
      gsap.fromTo('.wk-hero-label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 });
      gsap.fromTo('.wk-hero-heading', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.5 });
      gsap.fromTo('.wk-hero-body', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.8 });

      /* Work cards stagger */
      document.querySelectorAll('.wk-card').forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: 0.7, delay: i * 0.1,
          scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      /* Featured card */
      gsap.fromTo('.wk-featured', { opacity: 0, x: 60 }, {
        opacity: 1, x: 0, duration: 0.8,
        scrollTrigger: { trigger: '.wk-featured', start: 'top 80%', toggleActions: 'play none none none' },
      });

      /* Stats count-up */
      document.querySelectorAll('.wk-stat-num').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.8,
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });
      document.querySelectorAll('.wk-stat-label').forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, y: 10 }, {
          opacity: 1, y: 0, duration: 0.5, delay: 0.2 + i * 0.1,
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      /* CTA */
      gsap.fromTo('.wk-cta-heading', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8,
        scrollTrigger: { trigger: '.wk-cta-heading', start: 'top 80%', toggleActions: 'play none none none' },
      });
      gsap.fromTo('.wk-cta-btn', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.6, delay: 0.3,
        scrollTrigger: { trigger: '.wk-cta-btn', start: 'top 90%', toggleActions: 'play none none none' },
      });
    };

    init();
    return () => { if (ST) ST.getAll().forEach((t: { kill: () => void }) => t.kill()); };
  }, []);

  return (
    <div style={{ background: '#fffae6', minHeight: '100vh' }}>
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'flex-end', paddingBottom: 80, position: 'relative' }}>
        <div className="mk-container" style={{ width: '100%', paddingTop: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span className="wk-hero-label" style={{ ...labelStyle, display: 'block', marginBottom: 24, opacity: 0 }}>
                OUR WORK
              </span>
              <h1 className="wk-hero-heading" style={{
                fontFamily: h, fontWeight: 300, fontSize: 'clamp(80px, 12vw, 180px)',
                letterSpacing: '-0.01em', lineHeight: 1.0, color: '#1a1208',
                textTransform: 'uppercase', margin: 0, opacity: 0,
              }}>
                WE CREATE<br />DIGITAL<br />PRESENCE
              </h1>
            </div>
            <p className="wk-hero-body" style={{
              fontFamily: h, fontSize: 13, fontWeight: 400, letterSpacing: '0.02em',
              lineHeight: 1.6, color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase',
              maxWidth: 260, textAlign: 'left', margin: 0, opacity: 0, paddingBottom: 8,
            }}>
              EVERY BRAND WE TOUCH GETS A COMPLETE
              DIGITAL TRANSFORMATION — FROM STRATEGY
              TO EXECUTION TO ANALYTICS.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ WORK GRID ═══════════ */}
      <section style={{ padding: '80px 60px' }} className="wk-grid-section">
        {/* Row 1 — Three cards */}
        <div className="wk-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {row1.map((p, i) => (
            <ProjectCard key={i} {...p} height={400} />
          ))}
        </div>

        {/* Row 2 — Featured full-width */}
        <div
          className="wk-featured"
          style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr', height: 480,
            borderRadius: 12, overflow: 'hidden', marginBottom: 16,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)'; }}
        >
          {/* Image left */}
          <div style={{
            backgroundImage: featured.gradient, backgroundColor: 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: h, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.2)' }}>
              PROJECT IMAGE
            </span>
          </div>
          {/* Info right */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-block', background: '#1a1208', color: '#f3edd4',
              borderRadius: 999, padding: '4px 14px', fontFamily: h, fontSize: 11,
              fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 24, alignSelf: 'flex-start',
            }}>
              FEATURED PROJECT
            </span>
            <h3 style={{
              fontFamily: h, fontWeight: 300, fontSize: 32, letterSpacing: '-0.01em',
              lineHeight: 1.1, color: '#1a1208', textTransform: 'uppercase', margin: '0 0 8px',
            }}>
              {featured.name}
            </h3>
            <span style={{ ...labelStyle, display: 'block', marginBottom: 20 }}>
              {featured.category}
            </span>
            <p style={{
              fontFamily: h, fontSize: 14, fontWeight: 300, lineHeight: 1.7,
              letterSpacing: '0.03em', color: '#6B7280', textTransform: 'uppercase',
              whiteSpace: 'pre-line', margin: '0 0 24px',
            }}>
              {featured.desc}
            </p>
            <span style={{ fontFamily: h, fontSize: 11, fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>
              {featured.year}
            </span>
            <span
              style={{
                fontFamily: h, fontSize: 13, fontWeight: 500, color: '#1a1208',
                textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                position: 'relative', display: 'inline-block', alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => {
                const after = e.currentTarget.querySelector('.wk-underline') as HTMLElement;
                if (after) after.style.width = '100%';
              }}
              onMouseLeave={(e) => {
                const after = e.currentTarget.querySelector('.wk-underline') as HTMLElement;
                if (after) after.style.width = '0';
              }}
            >
              VIEW PROJECT →
              <span className="wk-underline" style={{
                position: 'absolute', bottom: -2, left: 0, width: 0, height: 1,
                background: '#1a1208', transition: 'width 0.3s ease',
              }} />
            </span>
          </div>
        </div>

        {/* Row 3 — Two cards */}
        <div className="wk-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {row3.map((p, i) => (
            <ProjectCard key={i} {...p} height={440} />
          ))}
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section ref={statsRef} style={{ padding: '80px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <span className="wk-stat-num" style={{
                display: 'block', fontFamily: h, fontSize: 72, fontWeight: 300,
                letterSpacing: '-0.02em', color: '#1a1208', lineHeight: 1, marginBottom: 12, opacity: 0,
              }}>
                {s.number}
              </span>
              <span className="wk-stat-label" style={{
                fontFamily: h, fontSize: 12, fontWeight: 500, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', opacity: 0,
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section style={{
        padding: '120px 60px', position: 'relative', overflow: 'hidden',
        backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(220,215,240,0.25) 0%, rgba(255,220,210,0.12) 40%, transparent 70%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }} className="wk-cta-inner">
          <h2 className="wk-cta-heading" style={{
            fontFamily: h, fontWeight: 300, fontSize: 'clamp(40px, 6vw, 80px)',
            letterSpacing: '-0.01em', lineHeight: 1.1, color: '#1a1208',
            textTransform: 'uppercase', margin: 0, opacity: 0,
          }}>
            WANT YOUR BRAND<br />TO BE NEXT?
          </h2>
          <div className="wk-cta-btn" style={{ textAlign: 'center', opacity: 0 }}>
            <Link
              href="/auth/register"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 40px', background: '#1a1208', color: '#f3edd4',
                borderRadius: 999, fontFamily: h, fontSize: 16, fontWeight: 300,
                letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              START YOUR FREE TRIAL <ArrowRight size={16} />
            </Link>
            <p style={{
              fontFamily: h, fontSize: 11, fontWeight: 400, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginTop: 16,
            }}>
              NO CREDIT CARD REQUIRED
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
