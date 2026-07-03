'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ padding: '40px 0' }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="no-underline"
            style={{
              fontFamily: 'var(--font-helvetica)',
              fontWeight: 700,
              fontSize: '14px',
              color: '#1a1208',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            APEX MARKETING
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {['Work', 'Services', 'Pricing'].map((label) => (
              <Link
                key={label}
                href={`/${label.toLowerCase()}`}
                className="no-underline"
                style={{
                  fontFamily: 'var(--font-helvetica)',
                  fontWeight: 300,
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6b5e45',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1208')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e45')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <span
            style={{
              fontFamily: 'var(--font-helvetica)',
              fontWeight: 300,
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(26, 18, 8, 0.45)',
            }}
          >
            © 2026 Apex Marketing
          </span>
        </div>
      </div>
    </footer>
  );
}
