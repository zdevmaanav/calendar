'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Animate navbar entrance — slides down
    setTimeout(() => setVisible(true), 200);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '/work', label: 'Work' },
    { href: '/services', label: 'Services' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <>
      <nav
        className="mk-navbar"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          boxShadow: scrolled ? '0 4px 30px rgba(26,18,8,0.04)' : 'none',
        }}
      >
        <div className="mk-navbar-inner">
          {/* Logo with orange accent dot */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#de662f',
                marginRight: '4px',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-helvetica)',
                fontWeight: 700,
                fontSize: '16px',
                color: '#1a1208',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              APEX MARKETING
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`mk-nav-link ${pathname === link.href ? 'mk-nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/auth/register" className="mk-nav-signup">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{ color: '#1a1208' }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'active' : ''}`}>
        <button
          className="absolute top-5 right-5 p-2"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          style={{ color: '#1a1208' }}
        >
          <X size={28} />
        </button>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/auth/register"
          className="mk-nav-signup mt-4"
          onClick={() => setMobileOpen(false)}
          style={{ fontSize: '16px', padding: '14px 36px' }}
        >
          Sign Up
        </Link>
      </div>
    </>
  );
}
