'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

const HeroParticles = dynamic(() => import('@/components/marketing/scenes/HeroParticles'), { ssr: false });

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let gsapModule: typeof import('gsap').gsap, ScrollTriggerModule: typeof import('gsap/ScrollTrigger').ScrollTrigger;

    const initAnimations = async () => {
      const gsapLib = await import('gsap');
      const stLib = await import('gsap/ScrollTrigger');
      gsapModule = gsapLib.gsap;
      ScrollTriggerModule = stLib.ScrollTrigger;
      gsapModule.registerPlugin(ScrollTriggerModule);

      // Hero text fade in — stagger each line
      const heroFades = heroRef.current?.querySelectorAll('.hero-fade');
      if (heroFades) {
        heroFades.forEach((el: Element, i: number) => {
          gsapModule.fromTo(el, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 1, delay: 0.5 + i * 0.15, ease: 'power3.out',
          });
        });
      }

      // Hero stagger elements
      gsapModule.fromTo('.hero-tag', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 });
      gsapModule.fromTo('.hero-body', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.4 });
      gsapModule.fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.8 });

      // Section scroll animations
      const sections = sectionsRef.current?.querySelectorAll('.mk-section');
      sections?.forEach((section: Element) => {
        const headings = section.querySelectorAll('.s-heading');
        const contents = section.querySelectorAll('.s-content');
        const cards = section.querySelectorAll('.s-card');

        headings.forEach((el: Element) => {
          gsapModule.fromTo(el, { opacity: 0, y: 60 }, {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });

        contents.forEach((el: Element, i: number) => {
          gsapModule.fromTo(el, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.7, delay: i * 0.1, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          });
        });

        cards.forEach((card: Element, i: number) => {
          gsapModule.fromTo(card, { opacity: 0, y: 50 }, {
            opacity: 1, y: 0, duration: 0.7, delay: i * 0.15, ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
          });
        });
      });

      // Brand statement paragraph-level reveal
      document.querySelectorAll('.brand-para').forEach((para: Element, i: number) => {
        gsapModule.fromTo(para, { opacity: 0, y: 50 }, {
          opacity: 1, y: 0, duration: 1, delay: i * 0.2, ease: 'power2.out',
          scrollTrigger: { trigger: para, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });

      // ===== SCRAPING SECTION ANIMATIONS =====
      const scrapingSection = document.querySelector('.scraping-section');
      if (scrapingSection) {
        const scrapingTl = gsapModule.timeline({
          scrollTrigger: { trigger: scrapingSection, start: 'top 80%', toggleActions: 'play none none none' },
        });
        scrapingTl.fromTo('.scraping-label', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0);
        scrapingTl.fromTo('.scraping-headline', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.1);
        scrapingTl.fromTo('.scraping-body', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
        const gridItems = scrapingSection.querySelectorAll('.scraping-grid-item');
        gridItems.forEach((item: Element, i: number) => {
          scrapingTl.fromTo(item, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.3 + i * 0.08);
        });

        scrapingTl.fromTo('.scraping-3d', { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.2);
      }

      // ===== PLANNING SECTION ANIMATIONS =====
      const planningSection = document.querySelector('.planning-section');
      if (planningSection) {
        const planTl = gsapModule.timeline({
          scrollTrigger: { trigger: planningSection, start: 'top 80%', toggleActions: 'play none none none' },
        });
        planTl.fromTo('.planning-label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0);
        planTl.fromTo('.planning-headline', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.1);
        planTl.fromTo('.planning-3d', { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.2);
        planTl.fromTo('.planning-card-1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.3);
        planTl.fromTo('.planning-card-2', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.4);
      }

      // ===== CONTENT STUDIO SECTION ANIMATIONS =====
      const studioSection = document.querySelector('.studio-section');
      if (studioSection) {
        const studioTl = gsapModule.timeline({
          scrollTrigger: { trigger: studioSection, start: 'top 80%', toggleActions: 'play none none none' },
        });
        studioTl.fromTo('.studio-3d', { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0);
        studioTl.fromTo('.studio-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
        studioTl.fromTo('.studio-headline', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.3);
        studioTl.fromTo('.studio-card-1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.4);
        studioTl.fromTo('.studio-card-2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.5);
      }

      // ===== PERFORMANCE SECTION ANIMATIONS =====
      const perfSection = document.querySelector('.performance-section');
      if (perfSection) {
        const perfTl = gsapModule.timeline({
          scrollTrigger: { trigger: perfSection, start: 'top 80%', toggleActions: 'play none none none' },
        });
        perfTl.fromTo('.performance-label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0);
        perfTl.fromTo('.performance-headline', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.1);
        perfTl.fromTo('.perf-subtext', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
        const perfCards = perfSection.querySelectorAll('.perf-top-card');
        perfCards.forEach((card: Element, i: number) => {
          perfTl.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.3 + i * 0.08);
        });
        perfTl.fromTo('.performance-3d', { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.2);
      }

      // ===== WORK PREVIEW SECTION ANIMATIONS =====
      const workPreview = document.querySelector('.work-preview-section');
      if (workPreview) {
        gsapModule.fromTo('.work-preview-text',
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: workPreview, start: 'top 80%', toggleActions: 'play none none none' }
          },
        );
        document.querySelectorAll('.work-preview-card').forEach((card: Element, i: number) => {
          gsapModule.fromTo(card,
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: workPreview, start: 'top 70%', toggleActions: 'play none none none' }
            },
          );
        });
      }

      // ===== SERVICES PREVIEW SECTION ANIMATIONS =====
      const servicesPreview = document.querySelector('.services-preview-section');
      if (servicesPreview) {
        gsapModule.fromTo('.services-preview-text',
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: servicesPreview, start: 'top 80%', toggleActions: 'play none none none' }
          },
        );
        document.querySelectorAll('.service-pill').forEach((pill: Element, i: number) => {
          gsapModule.fromTo(pill,
            { opacity: 0, y: 15 },
            {
              opacity: 1, y: 0, duration: 0.4, delay: i * 0.05, ease: 'power2.out',
              scrollTrigger: { trigger: servicesPreview, start: 'top 70%', toggleActions: 'play none none none' }
            },
          );
        });
      }

      // ===== PRICING PREVIEW SECTION ANIMATIONS =====
      const pricingPreview = document.querySelector('.pricing-preview-section');
      if (pricingPreview) {
        gsapModule.fromTo('.pricing-preview-text',
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: pricingPreview, start: 'top 80%', toggleActions: 'play none none none' }
          },
        );
        document.querySelectorAll('.pricing-preview-card').forEach((card: Element, i: number) => {
          gsapModule.fromTo(card,
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out',
              scrollTrigger: { trigger: pricingPreview, start: 'top 70%', toggleActions: 'play none none none' }
            },
          );
        });
      }

      // ===== TEAM SECTION ANIMATIONS =====
      const teamSection = document.querySelector('.team-section');
      if (teamSection) {
        // 1. Headline lines reveal — triggered once when section enters
        const headlineLines = teamSection.querySelectorAll('.team-headline-line');
        headlineLines.forEach((line: Element, i: number) => {
          gsapModule.fromTo(line,
            { opacity: 0, y: 60, clipPath: 'inset(100% 0 0 0)' },
            {
              opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.7, ease: 'power3.out',
              delay: 0.15 * i,
              scrollTrigger: { trigger: teamSection, start: 'top 80%', toggleActions: 'play none none none' },
            }
          );
        });

        // 2. Top-right description fades in
        gsapModule.fromTo('.team-description',
          { opacity: 0, y: 20 },
          {
            opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: teamSection, start: 'top 70%', toggleActions: 'play none none none' },
          }
        );

        // 3. Each card has its own ScrollTrigger based on its position
        const teamCards = teamSection.querySelectorAll('.team-card');
        teamCards.forEach((card: Element) => {
          gsapModule.fromTo(card,
            { opacity: 0, y: 40, scale: 0.95 },
            {
              opacity: 1, y: 0, scale: 1,
              duration: 0.8,
              ease: 'back.out(1.2)',
              scrollTrigger: {
                trigger: card,
                start: 'top 95%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      }

      // ===== CTA SECTION ANIMATIONS =====
      const ctaSection = document.querySelector('.cta-section');
      if (ctaSection) {
        const ctaTl = gsapModule.timeline({
          scrollTrigger: {
            trigger: ctaSection,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });

        // 1. Headline fades up
        ctaTl.fromTo('.cta-headline',
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          0
        );

        // 2. Small description fades in
        ctaTl.fromTo('.cta-subtext',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0.4
        );

        // 3. Form fields stagger in
        const formFields = ctaSection.querySelectorAll('.cta-form-field');
        formFields.forEach((field: Element, i: number) => {
          ctaTl.fromTo(field,
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
            0.6 + i * 0.1
          );
        });

        // 4. Send button fades in last
        ctaTl.fromTo('.cta-submit',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          1.0
        );
      }
    };

    initAnimations();
    return () => { if (ScrollTriggerModule) ScrollTriggerModule.getAll().forEach((t: { kill: () => void }) => t.kill()); };
  }, []);

  return (
    <div style={{ background: '#fffae6', minHeight: '100vh' }}>
      <Navbar />

      {/* ===== HERO (Noomo-style) ===== */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden" style={{ paddingBottom: '80px' }}>
        {/* 3D Background */}
        <div style={{ opacity: 0.7 }}>
          <HeroParticles />
        </div>

        {/* Soft gradient overlay */}
        <div className="hero-gradient-overlay" />

        {/* Content — uses same max-width/padding as navbar for perfect alignment */}
        <div className="relative" style={{ zIndex: 2, maxWidth: '1800px', margin: '0 auto', padding: '0 60px' }}>
          {/* Top left tag */}
          <div className="hero-tag absolute" style={{ top: '-40vh', left: '60px', opacity: 0 }}>
            <span style={{
              fontFamily: 'var(--font-helvetica)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(26,18,8,0.45)',
            }}>
              AI-Powered Marketing Automation
            </span>
          </div>

          {/* Main hero text — Noomo irregular alignment */}
          <div ref={heroRef} className="hero-text-container">
            <div className="hero-line hero-line-1 hero-fade" style={{ opacity: 0 }}>
              MINIMALIST CRAFT
            </div>
            <div className="hero-line hero-line-2 hero-fade" style={{ opacity: 0 }}>
              <span>MAXIMALIST</span>
            </div>
            <div className="hero-line hero-line-3 hero-fade" style={{ opacity: 0 }}>
              DIGITAL PRESENCE
            </div>
          </div>



          {/* Bottom row */}
          <div className="flex justify-between items-end mt-16">
            {/* Spacer for left */}
            <div />

            {/* Scroll indicator — bottom center-right area */}
            <div className="flex items-end gap-20">
              {/* Body text — bottom right */}
              <div className="hero-body" style={{ opacity: 0, maxWidth: '280px', textAlign: 'right' }}>
                <p style={{
                  fontFamily: 'var(--font-helvetica)',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1.6,
                  color: 'rgba(0,0,0,0.7)',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  WE BUILD MARKETING MACHINES THAT NEVER SLEEP.
                  INTELLIGENT, AUTOMATED, UNSTOPPABLE.
                </p>
              </div>

              {/* Scroll indicator */}
              <div className="hero-scroll flex flex-col items-center gap-3" style={{ opacity: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-helvetica)',
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.4)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                  Scroll
                </span>
                <div className="scroll-indicator-line" style={{ width: '1px', height: '30px' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={sectionsRef}>
        {/* ===== SECTION 2: SCRAPING ===== */}
        <section className="scraping-section" style={{
          height: '100vh', minHeight: 700, background: '#fffae6',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div className="scraping-3d" style={{ position: 'relative', overflow: 'hidden', opacity: 0 }}>
            <img src="/scraping.png" alt="Scraping" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }}>
            <span className="scraping-label" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 24, opacity: 0,
            }}>WE LEARN</span>
            <h2 className="scraping-headline" style={{
              fontFamily: 'var(--font-helvetica)', fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', color: '#1a1208',
              letterSpacing: '-0.02em', lineHeight: 0.9, margin: '0 0 32px 0', opacity: 0,
            }}>SCRAPING</h2>
            <p className="scraping-body" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 14, fontWeight: 300,
              lineHeight: 1.8, color: '#6b5e45', maxWidth: 400, margin: '0 0 40px 0',
              textTransform: 'uppercase', opacity: 0,
            }}>
              OUR AI SCRAPES YOUR ENTIRE DIGITAL FOOTPRINT. WEBSITE, SOCIAL MEDIA, AND ALL PUBLIC DATA — ANALYZED AND TURNED INTO BRAND INTELLIGENCE.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 360 }}>
              {['WEBSITE SCRAPING', 'SOCIAL ANALYSIS', 'VOICE DETECTION', 'AUDIENCE MAPPING'].map((item) => (
                <div key={item} className="scraping-grid-item" style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#de662f', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-helvetica)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1208' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: PLANNING ===== */}
        <section className="planning-section" style={{
          height: '100vh', minHeight: 700, background: '#fffae6',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }}>
            <span className="planning-label" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 24, opacity: 0,
            }}>WE PLAN</span>
            <h2 className="planning-headline" style={{
              fontFamily: 'var(--font-helvetica)', fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', color: '#1a1208',
              letterSpacing: '-0.02em', lineHeight: 0.9, margin: '0 0 32px 0', opacity: 0,
            }}>PLANNING</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 420 }}>
              <div className="planning-card-1" style={{ borderLeft: '2px solid #de662f', paddingLeft: 20, opacity: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-helvetica)', fontSize: 15, fontWeight: 500, color: '#1a1208', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Content Calendar</h3>
                <p style={{ fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 300, color: '#6b5e45', lineHeight: 1.6, margin: 0, textTransform: 'uppercase' }}>AI GENERATES YOUR 30-DAY CONTENT PLAN IN SECONDS.</p>
              </div>
              <div className="planning-card-2" style={{ borderLeft: '2px solid #de662f', paddingLeft: 20, opacity: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-helvetica)', fontSize: 15, fontWeight: 500, color: '#1a1208', margin: '0 0 8px 0', textTransform: 'uppercase' }}>AI Suggestions</h3>
                <p style={{ fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 300, color: '#6b5e45', lineHeight: 1.6, margin: 0, textTransform: 'uppercase' }}>PROACTIVE IDEAS BASED ON YOUR ANALYTICS AND TRENDS.</p>
              </div>
            </div>
          </div>
          <div className="planning-3d" style={{ position: 'relative', overflow: 'hidden', opacity: 0 }}>
            <img src="/planning.png" alt="Planning" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </section>


        {/* ===== SECTION 4: CONTENT STUDIO ===== */}
        <section className="studio-section" style={{
          height: '100vh', minHeight: 700, background: '#1a1208',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div className="studio-3d" style={{ position: 'relative', overflow: 'hidden', opacity: 0 }}>
            <img src="/studio.png" alt="Content Studio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }}>
            <span className="studio-label" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 24, opacity: 0,
            }}>WE CREATE</span>
            <h2 className="studio-headline" style={{
              fontFamily: 'var(--font-helvetica)', fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', color: '#fffae6',
              letterSpacing: '-0.02em', lineHeight: 0.9, margin: '0 0 32px 0', opacity: 0,
            }}>CONTENT<br />STUDIO</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 420 }}>
              <div className="studio-card-1" style={{ borderLeft: '2px solid #de662f', paddingLeft: 20, opacity: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-helvetica)', fontSize: 15, fontWeight: 500, color: '#fffae6', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Caption &amp; Image</h3>
                <p style={{ fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 300, color: 'rgba(255,250,230,0.6)', lineHeight: 1.6, margin: 0, textTransform: 'uppercase' }}>FIVE AI MODELS FUSED INTO ONE PERFECT CAPTION.</p>
              </div>
              <div className="studio-card-2" style={{ borderLeft: '2px solid #de662f', paddingLeft: 20, opacity: 0 }}>
                <h3 style={{ fontFamily: 'var(--font-helvetica)', fontSize: 15, fontWeight: 500, color: '#fffae6', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Avatar &amp; Video</h3>
                <p style={{ fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 300, color: 'rgba(255,250,230,0.6)', lineHeight: 1.6, margin: 0, textTransform: 'uppercase' }}>AI VIDEO AVATARS, VOICEOVER, AND MUSIC — NO FILMING.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: PERFORMANCE ===== */}
        <section className="performance-section" style={{
          height: '100vh', minHeight: 700, background: '#fffae6',
          display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }}>
            <span className="performance-label" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 24, opacity: 0,
            }}>WE PERFORM</span>
            <h2 className="performance-headline" style={{
              fontFamily: 'var(--font-helvetica)', fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', color: '#1a1208',
              letterSpacing: '-0.02em', lineHeight: 0.9, margin: '0 0 32px 0', opacity: 0,
            }}>PERFORMANCE</h2>
            <p className="perf-subtext" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 14, fontWeight: 300,
              lineHeight: 1.8, color: '#6b5e45', maxWidth: 400, margin: '0 0 40px 0',
              textTransform: 'uppercase', opacity: 0,
            }}>
              REAL-TIME DATA FROM ALL YOUR PLATFORMS. SOCIAL DASHBOARD, APPROVAL QUEUE, AND ANALYTICS IN ONE PLACE.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 420 }}>
              {['SOCIAL DASHBOARD', 'APPROVAL QUEUE', 'ANALYTICS'].map((item) => (
                <div key={item} className="perf-top-card" style={{
                  borderTop: '2px solid #de662f', paddingTop: 12, opacity: 0,
                }}>
                  <span style={{ fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1a1208' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="performance-3d" style={{ position: 'relative', overflow: 'hidden', opacity: 0 }}>
            <img src="/performance.png" alt="Performance" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </section>


        {/* ===== PREVIEW 1: WORK ===== */}
        <section className="work-preview-section" style={{
          minHeight: '100vh', background: '#fffae6', padding: '80px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 1800, margin: '0 auto',
        }}>
          <div className="work-preview-text" style={{ opacity: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-helvetica)', fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 14,
              }}>SELECTED WORK</span>
              <h2 style={{
                fontFamily: 'var(--font-helvetica)', fontWeight: 300,
                fontSize: 'clamp(40px, 5vw, 80px)', color: '#1a1208',
                letterSpacing: '-0.02em', lineHeight: 0.9, margin: 0, textTransform: 'uppercase',
              }}>PROJECTS</h2>
            </div>
            <span style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 300,
              color: 'rgba(0,0,0,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase',
              maxWidth: 220, textAlign: 'right', lineHeight: 1.6,
            }}>BRANDS WE HAVE TRANSFORMED WITH AI-POWERED MARKETING</span>
          </div>

          {[
            { num: '01', name: 'EURO INTERNATIONAL SCHOOL', cat: 'BRAND', year: '2024' },
            { num: '02', name: 'VISTARA HOSPITALITY GROUP', cat: 'HOSPITALITY', year: '2024' },
            { num: '03', name: 'NEXGEN PERFORMANCE ANALYTICS', cat: 'DATA', year: '2025' },
            { num: '04', name: 'ARTISAN CONTENT AUTOMATION', cat: 'AI', year: '2025' },
            { num: '05', name: 'MERIDIAN HEALTH SYSTEMS', cat: 'HEALTHCARE', year: '2025' },
          ].map((item) => (
            <a key={item.num} href="/work" className="work-preview-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 0', borderTop: '1px solid rgba(26,18,8,0.08)',
              textDecoration: 'none', cursor: 'pointer', opacity: 0,
              transition: 'padding-left 0.3s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = '20px'; }}
              onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = '0'; }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 300,
                  color: '#de662f', letterSpacing: '0.06em',
                }}>{item.num}</span>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 'clamp(15px, 1.8vw, 24px)',
                  fontWeight: 300, color: '#1a1208', letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)',
                }}>{item.year}</span>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
                }}>{item.cat}</span>
              </div>
            </a>
          ))}
          <div style={{ borderTop: '1px solid rgba(26,18,8,0.08)' }} />

          <a href="/work" style={{
            fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 400,
            color: '#de662f', textDecoration: 'none', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginTop: 28, display: 'inline-block',
          }}>VIEW ALL →</a>
        </section>

        <section className="services-preview-section" style={{
          minHeight: '100vh', background: '#fffae6', padding: '120px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 1800, margin: '0 auto',
        }}>
          <div className="services-preview-text" style={{ opacity: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 20,
              }}>CAPABILITIES</span>
              <h2 style={{
                fontFamily: 'var(--font-helvetica)', fontWeight: 300,
                fontSize: 'clamp(60px, 8vw, 120px)', color: '#1a1208',
                letterSpacing: '-0.02em', lineHeight: 0.9, margin: 0, textTransform: 'uppercase',
              }}>9 TOOLS</h2>
            </div>
            <a href="/services" style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 400,
              color: '#de662f', textDecoration: 'none', textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>ALL SERVICES →</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 40px' }}>
            {[
              { name: 'BRAND PROFILE', desc: 'AI-POWERED IDENTITY' },
              { name: 'ASSET LIBRARY', desc: 'CENTRALIZED MEDIA' },
              { name: 'CONTENT CALENDAR', desc: '30-DAY AUTO-PLAN' },
              { name: 'CAPTION & IMAGE', desc: '5-AI FUSION ENGINE' },
              { name: 'AVATAR VIDEOS', desc: 'AI SPOKESPERSON' },
              { name: 'VIDEO EDITOR', desc: 'TIMELINE & EFFECTS' },
              { name: 'APPROVAL QUEUE', desc: 'TEAM WORKFLOWS' },
              { name: 'SOCIAL DASHBOARD', desc: 'MULTI-PLATFORM' },
              { name: 'ANALYTICS', desc: 'REAL-TIME INSIGHTS' },
            ].map((service, i) => (
              <div key={service.name} className="service-pill" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '22px 0', borderTop: '1px solid rgba(26,18,8,0.08)',
                opacity: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{
                    fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 300,
                    color: '#de662f', letterSpacing: '0.04em',
                  }}>0{i + 1}</span>
                  <span style={{
                    fontFamily: 'var(--font-helvetica)', fontSize: 14, fontWeight: 300,
                    letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1a1208',
                  }}>{service.name}</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 10, fontWeight: 300,
                  color: 'rgba(0,0,0,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{service.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pricing-preview-section" style={{
          minHeight: '100vh', background: '#fffae6', padding: '120px 60px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: 1800, margin: '0 auto',
        }}>
          <div className="pricing-preview-text" style={{ opacity: 0, marginBottom: 80 }}>
            <span style={{
              fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#de662f', display: 'block', marginBottom: 20,
            }}>PRICING</span>
            <h2 style={{
              fontFamily: 'var(--font-helvetica)', fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', color: '#1a1208',
              letterSpacing: '-0.02em', lineHeight: 0.9, margin: 0, textTransform: 'uppercase',
            }}>FROM $39/MO</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { name: 'STARTER', price: '$39', note: '1 BRAND · ESSENTIALS', features: ['CONTENT CALENDAR', 'CAPTIONS', 'INSTAGRAM + FB', 'BASIC ANALYTICS'] },
              { name: 'PRO', price: '$99', note: '3 BRANDS · AI FUSION', featured: true, features: ['AI SUGGESTIONS', 'VIDEO AVATARS', 'SOCIAL DASHBOARD', 'ADVANCED ANALYTICS'] },
              { name: 'AGENCY', price: '$249', note: '10 BRANDS · WHITE LABEL', features: ['AI FUSION ENGINE', 'API ACCESS', 'CUSTOM INTEGRATIONS', 'SLA SUPPORT'] },
            ].map((plan) => (
              <div key={plan.name} className="pricing-preview-card" style={{
                padding: '40px 32px', opacity: 0,
                background: plan.featured ? '#1a1208' : 'rgba(255,255,255,0.4)',
                border: plan.featured ? 'none' : '1px solid rgba(26,18,8,0.08)',
                borderRadius: 12,
                transition: 'transform 0.3s ease',
                display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 11, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: plan.featured ? '#de662f' : 'rgba(0,0,0,0.4)',
                  display: 'block', marginBottom: 20,
                }}>{plan.name}</span>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 48, fontWeight: 200,
                  letterSpacing: '-0.03em',
                  color: plan.featured ? '#fffae6' : '#1a1208',
                  display: 'block', marginBottom: 4,
                }}>{plan.price}</span>
                <span style={{
                  fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 300,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: plan.featured ? 'rgba(255,250,230,0.5)' : '#6b5e45',
                  marginBottom: 24,
                }}>{plan.note}</span>
                <div style={{ height: 1, background: plan.featured ? 'rgba(255,250,230,0.1)' : 'rgba(0,0,0,0.06)', marginBottom: 20 }} />
                <div style={{ marginBottom: 28, flex: 1 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: plan.featured ? '#de662f' : 'rgba(26,18,8,0.2)', flexShrink: 0 }} />
                      <span style={{
                        fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 400,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: plan.featured ? 'rgba(255,250,230,0.6)' : '#6b5e45',
                      }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="/pricing" style={{
                  display: 'block', textAlign: 'center', padding: '12px 0',
                  fontFamily: 'var(--font-helvetica)', fontSize: 11, fontWeight: 400,
                  letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  background: plan.featured ? '#de662f' : 'transparent',
                  color: plan.featured ? '#fffae6' : '#1a1208',
                  border: plan.featured ? 'none' : '1px solid rgba(26,18,8,0.12)',
                }}>START →</a>
              </div>
            ))}
          </div>

          <a href="/pricing" style={{
            fontFamily: 'var(--font-helvetica)', fontSize: 12, fontWeight: 400,
            color: '#de662f', textDecoration: 'none', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginTop: 48, display: 'inline-block',
          }}>SEE ALL PLANS →</a>
        </section>

        {/* ===== SECTION 7: BRAND STATEMENT (Noomo-style) ===== */}
        <section className="mk-section" style={{ padding: '120px 0' }}>
          <div className="mk-container" style={{ position: 'relative' }}>



            {/* Top-right partner text */}
            <div className="brand-para" style={{
              position: 'absolute',
              top: 0,
              right: 0,
              maxWidth: '280px',
              textAlign: 'right',
              fontFamily: 'var(--font-helvetica)',
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '0.02em',
              lineHeight: 1.6,
              color: 'rgba(26,18,8,0.5)',
              textTransform: 'uppercase',
            }}>
              WE PARTNER WITH BRANDS WHO BELIEVE
              CRAFT MAKES THE DIFFERENCE.
              COMPANIES THAT VALUE INNOVATION,
              OBSESS OVER DETAILS, AND UNDERSTAND
              GREAT DIGITAL WORK REQUIRES TIME, TRUST,
              AND TRUE COLLABORATION.
            </div>

            {/* Left-aligned editorial paragraphs */}
            <div style={{ maxWidth: '800px', paddingLeft: '0' }}>
              <p className="brand-para" style={{
                fontFamily: 'var(--font-helvetica)',
                fontSize: 'clamp(26px, 4vw, 46px)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                lineHeight: 1.15,
                color: '#1a1208',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                AT APEX MARKETING, WE BUILD
                SELF-EVOLVING MARKETING MACHINES
                FOR BRANDS THAT DEMAND SPEED,
                PRECISION, AND DOMINANCE.
              </p>

              <p className="brand-para" style={{
                fontFamily: 'var(--font-helvetica)',
                fontSize: 'clamp(26px, 4vw, 46px)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                lineHeight: 1.15,
                color: '#1a1208',
                textTransform: 'uppercase',
                margin: 0,
                marginTop: '48px',
              }}>
                COMPANIES THAT VALUE INNOVATION UNDERSTAND
                THAT GREAT GROWTH REQUIRES A SYSTEM
                THAT NEVER SLEEPS. WE TURN YOUR VISION
                INTO AN ENGINE THAT COMMANDS YOUR DIGITAL PRESENCE.
              </p>
            </div>

          </div>
        </section>

        {/* ===== SECTION 8: TEAM (Noomo-style) ===== */}
        <section className="team-section">
          {/* Atmospheric gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 60% 50%, rgba(222, 102, 47, 0.06) 0%, rgba(255, 250, 230, 0) 40%, rgba(255, 250, 230, 0) 80%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />



          {/* Massive headline */}
          <h2 className="team-headline">
            <span className="team-headline-line">GREAT WORK</span>
            <span className="team-headline-line">CAN&apos;T HAPPEN</span>
            <span className="team-headline-line">WITHOUT</span>
            <span className="team-headline-line">A TEAM</span>
          </h2>

          {/* Top-right description */}
          <div className="team-description">
            We work as one team with our users.
            Through deep collaboration, we understand
            your brand and build systems that evolve
            with you. Our platform combines AI
            intelligence with human craft to create
            marketing that actually connects.
          </div>

          {/* Floating glass quote cards */}
          <div className="team-card team-card-1">
            <div className="team-card-brand">ADITYA.</div>
            <div className="team-card-quote">
              &ldquo;Great digital products don&apos;t just look beautiful —
              they feel intuitive. Every pixel should have a purpose
              and every interaction should tell a story.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">ADITYA</div>
              <div className="team-card-role">Founder &amp; Strategy</div>
            </div>
          </div>

          <div className="team-card team-card-2">
            <div className="team-card-brand">KESHAV.</div>
            <div className="team-card-quote">
              &ldquo;Code is craft. Building systems that scale
              gracefully while staying simple to use is the real
              engineering challenge — and the most rewarding one.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">KESHAV</div>
              <div className="team-card-role">Tech Lead</div>
            </div>
          </div>

          <div className="team-card team-card-3">
            <div className="team-card-brand">MAANAV.</div>
            <div className="team-card-quote">
              &ldquo;Design is problem solving made visible.
              Every brand has a story — our job is to translate
              that story into something unforgettable.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">MAANAV</div>
              <div className="team-card-role">Creative Director</div>
            </div>
          </div>

          <div className="team-card team-card-4">
            <div className="team-card-brand">ARJUN.</div>
            <div className="team-card-quote">
              &ldquo;Strategy without execution is just a dream.
              We turn ideas into systems that deliver measurable
              results for every brand we touch.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">ARJUN</div>
              <div className="team-card-role">Head of Strategy</div>
            </div>
          </div>

          <div className="team-card team-card-5">
            <div className="team-card-brand">PRIYA.</div>
            <div className="team-card-quote">
              &ldquo;Great marketing starts with understanding
              the audience. Data tells us what happened, but
              empathy tells us why it matters.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">PRIYA</div>
              <div className="team-card-role">Brand Strategist</div>
            </div>
          </div>

          <div className="team-card team-card-6">
            <div className="team-card-brand">ROHAN.</div>
            <div className="team-card-quote">
              &ldquo;AI is just a tool — the magic happens when
              human creativity guides it toward something
              genuinely valuable for the user.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">ROHAN</div>
              <div className="team-card-role">AI Engineer</div>
            </div>
          </div>

          <div className="team-card team-card-7">
            <div className="team-card-brand">ISHAAN.</div>
            <div className="team-card-quote">
              &ldquo;Every interface is a conversation between
              the product and the user. Our job is to make
              that conversation effortless.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">ISHAAN</div>
              <div className="team-card-role">Product Designer</div>
            </div>
          </div>

          <div className="team-card team-card-8">
            <div className="team-card-brand">ANANYA.</div>
            <div className="team-card-quote">
              &ldquo;Numbers don&apos;t lie, but they don&apos;t tell the
              full story either. The best insights come from
              connecting data to human behavior.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">ANANYA</div>
              <div className="team-card-role">Analytics Lead</div>
            </div>
          </div>

          <div className="team-card team-card-9">
            <div className="team-card-brand">KABIR.</div>
            <div className="team-card-quote">
              &ldquo;Content that converts isn&apos;t about shouting
              louder — it&apos;s about speaking directly to what
              your audience actually cares about.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">KABIR</div>
              <div className="team-card-role">Content Director</div>
            </div>
          </div>

          <div className="team-card team-card-10">
            <div className="team-card-brand">MEERA.</div>
            <div className="team-card-quote">
              &ldquo;Performance marketing is equal parts art
              and science. The creative has to stop the scroll
              before the targeting can do its job.&rdquo;
            </div>
            <div className="team-card-bottom">
              <div className="team-card-name">MEERA</div>
              <div className="team-card-role">Performance Marketing</div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 9: CTA + REGISTRATION (Noomo-style) ===== */}
        <section className="cta-section">
          {/* Atmospheric gradient */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(220, 215, 240, 0.4) 0%, rgba(255, 220, 210, 0.25) 40%, rgba(255, 255, 255, 0) 80%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          <div className="cta-left">
            <h2 className="cta-headline">
              BUT WE&apos;RE HERE NOT TO TALK ABOUT OURSELVES — WE&apos;RE HERE TO TALK ABOUT YOU, YOUR COMPANY, YOUR PRODUCT, AND YOUR GOALS.
            </h2>
            <p className="cta-subtext">
              WITH US IT HAPPENS.<br />
              WE WOULD LOVE TO HEAR FROM YOU.
            </p>

          </div>

          <div className="cta-right">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="cta-form-field">
                <label className="cta-form-label">YOUR NAME</label>
                <input type="text" className="cta-form-input" />
              </div>
              <div className="cta-form-field">
                <label className="cta-form-label">YOUR EMAIL</label>
                <input type="email" className="cta-form-input" />
              </div>
              <div className="cta-form-field">
                <label className="cta-form-label">YOUR COMPANY</label>
                <input type="text" className="cta-form-input" />
              </div>
              <div className="cta-form-field">
                <label className="cta-form-label">YOUR MESSAGE</label>
                <input type="text" className="cta-form-input" />
              </div>
              <div className="cta-submit" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
                <button type="submit" className="cta-send-btn">
                  SEND <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
