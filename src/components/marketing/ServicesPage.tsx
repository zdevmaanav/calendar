'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

/* ── Lazy-loaded Three.js scenes ── */
const BrandHelixScene = dynamic(() => import('@/components/marketing/scenes/BrandHelixScene'), { ssr: false });
const FileGridScene = dynamic(() => import('@/components/marketing/scenes/FileGridScene'), { ssr: false });
const CalendarGridScene = dynamic(() => import('@/components/marketing/scenes/CalendarGridScene'), { ssr: false });
const FusionScene = dynamic(() => import('@/components/marketing/scenes/FusionScene'), { ssr: false });
const AvatarScene = dynamic(() => import('@/components/marketing/scenes/AvatarScene'), { ssr: false });
const FilmReelScene = dynamic(() => import('@/components/marketing/scenes/FilmReelScene'), { ssr: false });
const ApprovalScene = dynamic(() => import('@/components/marketing/scenes/ApprovalScene'), { ssr: false });
const PlatformHubScene = dynamic(() => import('@/components/marketing/scenes/PlatformHubScene'), { ssr: false });
const DataChartsScene = dynamic(() => import('@/components/marketing/scenes/DataChartsScene'), { ssr: false });

/* ── Service data ── */
const services = [
  {
    label: 'INTELLIGENCE', title: 'BRAND\nPROFILE',
    desc: 'A LIVING DOCUMENT OF YOUR BRAND\nIDENTITY BUILT BY AI. UPDATED EVERY\nWEEK AS YOUR BRAND EVOLVES. THE\nFOUNDATION OF EVERYTHING WE CREATE.',
    pills: ['AI-BUILT IDENTITY MAP', 'WEEKLY AUTO-UPDATES', 'COLOR THEME EXTRACTION', 'VOICE & TONE DETECTION', 'AUDIENCE PROFILING'],
    Scene: BrandHelixScene, sceneRight: true,
  },
  {
    label: 'CREATIVE VAULT', title: 'ASSET\nLIBRARY',
    desc: 'UPLOAD IMAGES, VIDEOS, LOGOS AND\nBRAND ASSETS. OUR AI REFERENCES THESE\nWHEN CREATING CONTENT — ENSURING EVERY\nPOST FEELS AUTHENTICALLY YOURS.',
    pills: ['DRAG & DROP UPLOAD', 'AUTO-ORGANIZED BY TYPE', 'AI-REFERENCED IN GENERATION', 'BRAND VS POST-READY CATEGORIES'],
    Scene: FileGridScene, sceneRight: false,
  },
  {
    label: 'PLANNING LAYER', title: 'CONTENT\nCALENDAR',
    desc: 'AI GENERATES YOUR ENTIRE MONTH\'S\nCONTENT PLAN IN SECONDS. FESTIVALS,\nTRENDS, AND INDUSTRY EVENTS — ALL\nCONSIDERED AUTOMATICALLY.',
    pills: ['30-DAY AI PLANNING', 'FESTIVAL & TREND AWARE', 'DRAG & DROP EDITING', 'SCHEDULING & TIMING'],
    Scene: CalendarGridScene, sceneRight: true,
  },
  {
    label: 'CREATION LAYER', title: 'CAPTION\n& IMAGE',
    desc: 'FIVE AI MODELS WRITE YOUR CAPTIONS\nSIMULTANEOUSLY. THE BEST PARTS FROM\nEACH ARE FUSED INTO ONE PERFECT OUTPUT\nBY CLAUDE. IMAGES MATCH YOUR BRAND\nAUTOMATICALLY.',
    pills: ['5-AI FUSION SYSTEM', 'BRAND VOICE MATCHING', 'HASHTAG GENERATION', 'IMAGE AUTO-GENERATION'],
    Scene: FusionScene, sceneRight: false,
  },
  {
    label: 'VIDEO LAYER', title: 'AVATAR\nVIDEOS',
    desc: 'AI-GENERATED VIDEO AVATARS THAT\nREPRESENT YOUR BRAND. AUTOMATED REEL\nCREATION WITH VOICEOVER AND BACKGROUND\nMUSIC — ALL WITHOUT FILMING ANYTHING.',
    pills: ['AI AVATAR GENERATION', 'AUTO VOICEOVER', 'BACKGROUND MUSIC', 'REEL READY FORMAT'],
    Scene: AvatarScene, sceneRight: true,
  },
  {
    label: 'EDITING LAYER', title: 'VIDEO\nEDITOR',
    desc: 'A FULL AI-POWERED VIDEO EDITOR BUILT\nINTO THE PLATFORM. TRIM, CAPTION, ADD\nMUSIC, AND EXPORT YOUR REELS DIRECTLY\nTO YOUR SOCIAL CHANNELS.',
    pills: ['AI AUTO-TRIM', 'AUTO CAPTIONS', 'MUSIC LIBRARY', 'DIRECT EXPORT'],
    Scene: FilmReelScene, sceneRight: false,
  },
  {
    label: 'CONTROL LAYER', title: 'APPROVAL\nQUEUE',
    desc: 'NOTHING POSTS WITHOUT YOUR APPROVAL.\nREVIEW, EDIT, AND APPROVE EVERY PIECE\nOF CONTENT BEFORE IT GOES LIVE ON\nYOUR CHANNELS.',
    pills: ['REVIEW BEFORE POST', 'EDIT & REFINE', 'ONE-CLICK APPROVE', 'REJECT & REGENERATE'],
    Scene: ApprovalScene, sceneRight: true,
  },
  {
    label: 'COMMAND CENTER', title: 'SOCIAL\nDASHBOARD',
    desc: 'SEE ALL YOUR CONNECTED PLATFORMS,\nPOSTING FREQUENCY, AND PERFORMANCE\nDATA IN ONE UNIFIED VIEW. COMPLETE\nVISIBILITY AT A GLANCE.',
    pills: ['ALL PLATFORMS', 'REAL-TIME DATA', 'POSTING HISTORY', 'PLATFORM HEALTH'],
    Scene: PlatformHubScene, sceneRight: false,
  },
  {
    label: 'INSIGHTS LAYER', title: 'ANALYTICS',
    desc: 'REAL-TIME PERFORMANCE DATA PULLED\nDIRECTLY FROM YOUR SOCIAL CHANNELS.\nKNOW WHAT WORKS, WHAT DOESN\'T, AND\nWHAT TO CREATE NEXT.',
    pills: ['REAL-TIME METRICS', 'ENGAGEMENT TRACKING', 'CONTENT PERFORMANCE', 'AI RECOMMENDATIONS'],
    Scene: DataChartsScene, sceneRight: true,
  },
];

const h = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ── Atmospheric gradients per section ── */
const gradients = [
  'radial-gradient(ellipse at 30% 50%, rgba(222,102,47,0.04) 0%, transparent 60%)',
  'radial-gradient(ellipse at 70% 50%, rgba(222,102,47,0.03) 0%, transparent 60%)',
  'radial-gradient(ellipse at 30% 40%, rgba(222,102,47,0.04) 0%, transparent 55%)',
  'radial-gradient(ellipse at 70% 60%, rgba(222,102,47,0.03) 0%, transparent 60%)',
  'radial-gradient(ellipse at 30% 50%, rgba(222,102,47,0.04) 0%, transparent 55%)',
  'radial-gradient(ellipse at 70% 40%, rgba(222,102,47,0.03) 0%, transparent 60%)',
  'radial-gradient(ellipse at 30% 60%, rgba(222,102,47,0.04) 0%, transparent 55%)',
  'radial-gradient(ellipse at 70% 50%, rgba(222,102,47,0.03) 0%, transparent 60%)',
  'radial-gradient(ellipse at 30% 40%, rgba(222,102,47,0.04) 0%, transparent 55%)',
];

export default function ServicesPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ST: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      ST = ScrollTrigger;

      /* Hero animations */
      gsap.fromTo('.svc-hero-label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 });
      gsap.fromTo('.svc-hero-heading', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.5 });
      gsap.fromTo('.svc-hero-body', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.8 });

      /* Service section animations */
      document.querySelectorAll('.svc-section').forEach((section) => {
        const text = section.querySelector('.svc-text');
        const visual = section.querySelector('.svc-visual');
        const pills = section.querySelectorAll('.svc-pill');

        if (text) {
          gsap.fromTo(text, { opacity: 0, y: 60 }, {
            opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none none' },
          });
        }

        if (visual) {
          gsap.fromTo(visual, { opacity: 0, scale: 0.9 }, {
            opacity: 1, scale: 1, duration: 0.8, delay: 0.15, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none none' },
          });
        }

        if (pills.length) {
          gsap.fromTo(pills, { opacity: 0, y: 15 }, {
            opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out',
            scrollTrigger: { trigger: section, start: 'top 60%', toggleActions: 'play none none none' },
          });
        }
      });
    };

    init();
    return () => { if (ST) ST.getAll().forEach((t: { kill: () => void }) => t.kill()); };
  }, []);

  return (
    <div ref={containerRef} style={{ background: '#fffae6', minHeight: '100vh' }}>
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-end', paddingBottom: 80, position: 'relative' }}>
        <div className="mk-container" style={{ width: '100%', paddingTop: 120 }}>
          {/* Label */}
          <span className="svc-hero-label" style={{
            display: 'block', fontFamily: h, fontSize: 11, fontWeight: 400,
            letterSpacing: '0.1em', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase' as const,
            marginBottom: 24, opacity: 0, textAlign: 'center',
          }}>
            OUR CRAFT
          </span>

          {/* Heading */}
          <h1 className="svc-hero-heading" style={{
            fontFamily: h, fontWeight: 300,
            fontSize: 'clamp(80px, 12vw, 180px)', letterSpacing: '-0.01em',
            lineHeight: 0.95, color: '#1a1208', textTransform: 'uppercase' as const,
            textAlign: 'left', margin: 0, opacity: 0,
          }}>
            EVERYTHING<br />YOUR BRAND<br />NEEDS
          </h1>

          {/* Body text — bottom right */}
          <p className="svc-hero-body" style={{
            fontFamily: h, fontSize: 13, fontWeight: 400,
            letterSpacing: '0.02em', lineHeight: 1.6, color: 'rgba(0,0,0,0.55)',
            textTransform: 'uppercase' as const, maxWidth: 260,
            marginLeft: 'auto', marginTop: 40, textAlign: 'left', opacity: 0,
          }}>
            FROM INTELLIGENCE TO EXECUTION —
            EVERY TOOL YOUR MARKETING
            TEAM NEEDS IN ONE PLACE.
          </p>
        </div>
      </section>

      {/* ═══════════ SERVICE SECTIONS ═══════════ */}
      {services.map((svc, i) => {
        const SceneComponent = svc.Scene;
        const textSide = (
          <div className="svc-text" style={{ opacity: 0 }}>
            <span style={{
              display: 'block', fontFamily: h, fontSize: 11, fontWeight: 400,
              letterSpacing: '0.1em', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase' as const,
              marginBottom: 20,
            }}>
              {svc.label}
            </span>
            <h2 style={{
              fontFamily: h, fontWeight: 300,
              fontSize: 'clamp(60px, 8vw, 120px)', letterSpacing: '-0.01em',
              lineHeight: 0.95, color: '#1a1208', textTransform: 'uppercase' as const,
              whiteSpace: 'pre-line', margin: '0 0 32px 0',
            }}>
              {svc.title}
            </h2>
            <p style={{
              fontFamily: h, fontSize: 16, fontWeight: 300, lineHeight: 1.7,
              letterSpacing: '0.03em', color: '#6B7280', textTransform: 'uppercase' as const,
              whiteSpace: 'pre-line', maxWidth: 480, marginBottom: 40,
            }}>
              {svc.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {svc.pills.map((pill, j) => (
                <span key={j} className="svc-pill" style={{
                  fontFamily: h, fontSize: 11, fontWeight: 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                  color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 999, padding: '6px 14px',
                  background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s', cursor: 'default', opacity: 0,
                }}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
        );

        const sceneSide = (
          <div className="svc-visual" style={{ opacity: 0, minHeight: 400 }}>
            <SceneComponent />
          </div>
        );

        return (
          <section
            key={i}
            className="svc-section"
            style={{
              minHeight: '100vh', display: 'flex', alignItems: 'center',
              padding: '100px 0', position: 'relative', overflow: 'hidden',
              backgroundImage: gradients[i],
            }}
          >
            <div className="mk-container" style={{ width: '100%' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 60,
                alignItems: 'center',
              }}
                className="svc-grid"
              >
                {svc.sceneRight ? (
                  <>{textSide}{sceneSide}</>
                ) : (
                  <>{sceneSide}{textSide}</>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <Footer />
    </div>
  );
}
