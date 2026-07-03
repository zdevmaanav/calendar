'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Minus } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const h = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ── Plan data (minimal) ── */
const plans = [
  {
    name: 'STARTER', price: '$39', period: '/MO',
    tagline: 'FOR SOLO BRANDS',
    features: ['1 BRAND', '500MB ASSETS', 'CALENDAR', 'CAPTIONS', 'APPROVAL QUEUE', 'BASIC ANALYTICS'],
  },
  {
    name: 'PRO', price: '$99', period: '/MO', popular: true,
    tagline: 'FOR GROWING TEAMS',
    features: ['3 BRANDS', '5GB ASSETS', 'AI SUGGESTIONS', 'VIDEO AVATARS', 'SOCIAL DASHBOARD', 'ADVANCED ANALYTICS'],
  },
  {
    name: 'AGENCY', price: '$249', period: '/MO',
    tagline: 'FOR AGENCIES',
    features: ['10 BRANDS', 'UNLIMITED ASSETS', 'AI FUSION', 'WHITE LABEL', 'API ACCESS', 'SLA SUPPORT'],
  },
];

/* ── Pay-per-use ── */
const paygo = [
  { feature: 'CAPTION', price: '$0.20' },
  { feature: 'IMAGE', price: '$0.30' },
  { feature: 'VIDEO AVATAR', price: '$1.99/MIN' },
  { feature: 'BRAND ANALYSIS', price: '$2.49' },
  { feature: 'CALENDAR', price: '$3.99/MO' },
  { feature: 'AI SUGGESTIONS', price: '$0.59' },
];

/* ── FAQ (trimmed) ── */
const faqs = [
  { q: 'FREE TRIAL?', a: '14 DAYS. NO CARD REQUIRED.' },
  { q: 'CAN I SWITCH PLANS?', a: 'ANYTIME. CHANGES APPLY NEXT CYCLE.' },
  { q: 'WHICH PLATFORMS?', a: 'INSTAGRAM, FACEBOOK, YOUTUBE.' },
  { q: 'DATA SECURITY?', a: 'ENCRYPTED. INDUSTRY STANDARD.' },
];

/* ── FAQ Item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(26,18,8,0.08)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: h, fontSize: 13, fontWeight: 400, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: '#1a1208', textAlign: 'left',
        }}
      >
        <span>{q}</span>
        {open
          ? <Minus size={14} style={{ color: '#de662f', flexShrink: 0 }} />
          : <Plus size={14} style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />}
      </button>
      <div style={{
        overflow: 'hidden', maxHeight: open ? 100 : 0,
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <p style={{
          fontFamily: h, fontSize: 12, fontWeight: 300, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: '#6b5e45', lineHeight: 1.6,
          padding: '0 0 20px 0', margin: 0,
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ST: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      ST = ScrollTrigger;

      /* Hero */
      gsap.fromTo('.pr-label', { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, delay: 0.3 });
      gsap.fromTo('.pr-heading', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.4 });

      /* Cards */
      document.querySelectorAll('.pr-card').forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.12,
          scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
        });
      });

      /* Pay-per-use */
      gsap.fromTo('.pr-paygo-heading', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7,
        scrollTrigger: { trigger: '.pr-paygo-heading', start: 'top 85%', toggleActions: 'play none none none' },
      });
      document.querySelectorAll('.pr-paygo-item').forEach((item, i) => {
        gsap.fromTo(item, { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.5, delay: i * 0.06,
          scrollTrigger: { trigger: item, start: 'top 92%', toggleActions: 'play none none none' },
        });
      });

      /* FAQ */
      gsap.fromTo('.pr-faq-heading', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7,
        scrollTrigger: { trigger: '.pr-faq-heading', start: 'top 85%', toggleActions: 'play none none none' },
      });
      document.querySelectorAll('.faq-item-wrap').forEach((item, i) => {
        gsap.fromTo(item, { opacity: 0, y: 15 }, {
          opacity: 1, y: 0, duration: 0.4, delay: i * 0.08,
          scrollTrigger: { trigger: item, start: 'top 92%', toggleActions: 'play none none none' },
        });
      });

      /* Bottom CTA */
      gsap.fromTo('.pr-cta', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7,
        scrollTrigger: { trigger: '.pr-cta', start: 'top 85%', toggleActions: 'play none none none' },
      });
    };

    init();
    return () => { if (ST) ST.getAll().forEach((t: { kill: () => void }) => t.kill()); };
  }, []);

  return (
    <div style={{ background: '#fffae6', minHeight: '100vh' }}>
      <Navbar />

      {/* ═══════════ SECTION 1: HERO ═══════════ */}
      <section style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '0 60px 80px',
        maxWidth: 1800, margin: '0 auto',
      }}>
        <span className="pr-label" style={{
          fontFamily: h, fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#de662f',
          display: 'block', marginBottom: 28, opacity: 0,
        }}>PRICING</span>

        <h1 className="pr-heading" style={{
          fontFamily: h, fontWeight: 300,
          fontSize: 'clamp(80px, 12vw, 180px)',
          letterSpacing: '-0.02em', lineHeight: 0.9,
          color: '#1a1208', textTransform: 'uppercase',
          margin: 0, opacity: 0,
        }}>
          CHOOSE YOUR<br />SCALE
        </h1>
      </section>

      {/* ═══════════ SECTION 2: SUBSCRIPTIONS ═══════════ */}
      <section style={{
        minHeight: '100vh', maxWidth: 1800, margin: '0 auto',
        padding: '60px 60px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className="pr-card"
              style={{
                position: 'relative', opacity: 0,
                background: plan.popular ? '#1a1208' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: plan.popular ? 'none' : '1px solid rgba(26,18,8,0.08)',
                borderRadius: 16, padding: '40px 32px',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Plan header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <span style={{
                    fontFamily: h, fontSize: 11, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: plan.popular ? '#de662f' : 'rgba(0,0,0,0.4)',
                    display: 'block', marginBottom: 6,
                  }}>{plan.tagline}</span>
                  <span style={{
                    fontFamily: h, fontSize: 16, fontWeight: 500,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: plan.popular ? '#fffae6' : '#1a1208',
                  }}>{plan.name}</span>
                </div>
                {plan.popular && (
                  <span style={{
                    fontFamily: h, fontSize: 10, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#de662f',
                    border: '1px solid rgba(222,102,47,0.3)', borderRadius: 999,
                    padding: '4px 12px',
                  }}>POPULAR</span>
                )}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 32 }}>
                <span style={{
                  fontFamily: h, fontSize: 48, fontWeight: 200,
                  letterSpacing: '-0.03em',
                  color: plan.popular ? '#fffae6' : '#1a1208',
                }}>{plan.price}</span>
                <span style={{
                  fontFamily: h, fontSize: 13, fontWeight: 300,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: plan.popular ? 'rgba(255,250,230,0.4)' : 'rgba(0,0,0,0.35)',
                  marginLeft: 4,
                }}>{plan.period}</span>
              </div>

              {/* Divider */}
              <div style={{
                height: 1, marginBottom: 24,
                background: plan.popular ? 'rgba(255,250,230,0.1)' : 'rgba(0,0,0,0.06)',
              }} />

              {/* Features — minimal list */}
              <div style={{ marginBottom: 32 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '5px 0',
                  }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                      background: plan.popular ? '#de662f' : 'rgba(26,18,8,0.2)',
                    }} />
                    <span style={{
                      fontFamily: h, fontSize: 12, fontWeight: 400,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: plan.popular ? 'rgba(255,250,230,0.7)' : '#6b5e45',
                    }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/auth/register"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px 0',
                  fontFamily: h, fontSize: 12, fontWeight: 400, letterSpacing: '0.1em',
                  textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: plan.popular ? '#de662f' : 'transparent',
                  color: plan.popular ? '#fffae6' : '#1a1208',
                  border: plan.popular ? 'none' : '1px solid rgba(26,18,8,0.15)',
                }}
                onMouseEnter={(e) => {
                  if (plan.popular) { e.currentTarget.style.background = '#c5562a'; }
                  else { e.currentTarget.style.background = '#1a1208'; e.currentTarget.style.color = '#fffae6'; e.currentTarget.style.borderColor = '#1a1208'; }
                }}
                onMouseLeave={(e) => {
                  if (plan.popular) { e.currentTarget.style.background = '#de662f'; }
                  else { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a1208'; e.currentTarget.style.borderColor = 'rgba(26,18,8,0.15)'; }
                }}
              >
                START <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ SECTION 3: PAY-PER-USE ═══════════ */}
      <section style={{
        minHeight: '100vh', maxWidth: 1800, margin: '0 auto',
        padding: '60px 60px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
          <h2 className="pr-paygo-heading" style={{
            fontFamily: h, fontWeight: 300,
            fontSize: 'clamp(60px, 8vw, 120px)',
            letterSpacing: '-0.02em', lineHeight: 0.9,
            color: '#1a1208', textTransform: 'uppercase', margin: 0, opacity: 0,
          }}>PAY AS<br />YOU GO</h2>
          <span style={{
            fontFamily: h, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)',
          }}>USE WHAT YOU NEED</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        }}>
          {paygo.map((item, i) => (
            <div
              key={i}
              className="pr-paygo-item"
              style={{
                opacity: 0,
                background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(26,18,8,0.06)', borderRadius: 12,
                padding: '24px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'border-color 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(222,102,47,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,18,8,0.06)'; }}
            >
              <span style={{
                fontFamily: h, fontSize: 13, fontWeight: 400,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1208',
              }}>{item.feature}</span>
              <span style={{
                fontFamily: h, fontSize: 13, fontWeight: 300,
                letterSpacing: '0.04em', color: '#de662f',
              }}>{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ SECTION 4: FAQ + CTA ═══════════ */}
      <section style={{
        minHeight: '100vh', maxWidth: 1800, margin: '0 auto',
        padding: '60px 60px', display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 140,
        alignItems: 'center', alignContent: 'center',
      }}>
        {/* FAQ — left */}
        <div>
          <h2 className="pr-faq-heading" style={{
            fontFamily: h, fontWeight: 300,
            fontSize: 'clamp(48px, 6vw, 80px)',
            letterSpacing: '-0.01em', lineHeight: 0.95,
            color: '#1a1208', textTransform: 'uppercase',
            margin: '0 0 40px 0', opacity: 0,
          }}>FAQ</h2>
          <div>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item-wrap">
                <FaqItem q={faq.q} a={faq.a} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA — right */}
        <div className="pr-cta" style={{
          opacity: 0, paddingTop: 20,
        }}>
          <span style={{
            fontFamily: h, fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#de662f',
            display: 'block', marginBottom: 20,
          }}>GET STARTED</span>

          <h2 style={{
            fontFamily: h, fontWeight: 300,
            fontSize: 'clamp(36px, 4vw, 56px)',
            letterSpacing: '-0.01em', lineHeight: 1.1,
            color: '#1a1208', textTransform: 'uppercase',
            margin: '0 0 32px 0',
          }}>
            AUTOMATE<br />YOUR MARKETING
          </h2>

          <p style={{
            fontFamily: h, fontSize: 12, fontWeight: 400,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.45)', lineHeight: 1.7,
            margin: '0 0 40px 0', maxWidth: 320,
          }}>
            14-DAY FREE TRIAL.<br />NO CREDIT CARD.
          </p>

          <Link
            href="/auth/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 40px',
              background: '#1a1208', color: '#fffae6',
              fontFamily: h, fontSize: 13, fontWeight: 300,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#de662f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1208'; }}
          >
            START FREE <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
