import React, { useState, useCallback } from 'react';
import { EmailBlockEditor, renderEmailDocument, createEmptyDocument } from '@block-based/block-based';
import type { EmailDocument } from '@block-based/block-based';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0f0f0f',
  surface: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  muted: '#a1a1aa',
  accent: '#2563eb',
  accentHover: '#3b82f6',
  accentLight: 'rgba(37,99,235,0.12)',
};

// ─── Inline styles ─────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
    height: 60,
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: 800,
    fontSize: 18,
    color: C.text,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoAccent: {
    color: C.accent,
  },
  navLinks: {
    display: 'flex',
    gap: 24,
    marginLeft: 48,
  },
  navLink: {
    color: C.muted,
    textDecoration: 'none',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
  navSpacer: { flex: 1 },
  ctaBtn: {
    padding: '8px 20px',
    borderRadius: 8,
    background: C.accent,
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '96px 32px 64px',
    gap: 24,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 100,
    background: C.accentLight,
    color: C.accent,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${C.accent}33`,
  },
  heading: {
    fontSize: 'clamp(36px, 6vw, 60px)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    maxWidth: 720,
    margin: 0,
  },
  sub: {
    fontSize: 18,
    color: C.muted,
    maxWidth: 560,
    lineHeight: 1.6,
    margin: 0,
  },
  heroBtns: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '12px 28px',
    borderRadius: 10,
    background: C.accent,
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '12px 28px',
    borderRadius: 10,
    background: 'transparent',
    color: C.text,
    border: `1px solid ${C.border}`,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
  },
  // Demo section
  demoSection: {
    padding: '0 32px 96px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  demoLabel: {
    fontSize: 13,
    color: C.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  demoWrapper: {
    width: '100%',
    maxWidth: 1200,
    height: 600,
    borderRadius: 16,
    overflow: 'hidden',
    border: `1px solid ${C.border}`,
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
  },
  // Features
  features: {
    padding: '96px 32px',
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
  },
  featuresInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 56,
  },
  featuresTitle: {
    textAlign: 'center' as const,
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: '28px 24px',
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    background: C.bg,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: C.accentLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  featureTitle: { fontWeight: 700, fontSize: 16, margin: 0 },
  featureDesc: { color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 },
  // Code section
  code: {
    padding: '96px 32px',
  },
  codeInner: {
    maxWidth: 800,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 32,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  codeTitle: {
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  codeBlock: {
    width: '100%',
    textAlign: 'left' as const,
    background: C.surface,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: '24px 28px',
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    fontSize: 13,
    lineHeight: 1.7,
    color: '#cdd6f4',
    overflowX: 'auto' as const,
    whiteSpace: 'pre' as const,
  },
  // Footer
  footer: {
    padding: '32px',
    borderTop: `1px solid ${C.border}`,
    textAlign: 'center' as const,
    color: C.muted,
    fontSize: 13,
    background: C.surface,
  },
};

const FEATURES = [
  {
    icon: '⚡',
    title: 'Block-based editing',
    desc: 'Build emails from composable blocks — headings, paragraphs, buttons, images, menus, dividers, spacers, and raw HTML.',
  },
  {
    icon: '🎨',
    title: 'Visual inspector',
    desc: 'Click any block to inspect and edit its properties: typography, colours, padding, margins, borders, and alignment.',
  },
  {
    icon: '📐',
    title: 'Multi-column layouts',
    desc: 'Arrange blocks in 1–4 column grids with flexible width ratios. Drag to reorder sections and blocks.',
  },
  {
    icon: '📧',
    title: 'Email-safe HTML output',
    desc: 'Renders table-based, client-compatible HTML that displays correctly across all major email clients.',
  },
  {
    icon: '🔌',
    title: 'Framework agnostic data model',
    desc: 'The document schema is plain JSON. Bring your own storage — save to a database, local state, or anywhere.',
  },
  {
    icon: '🚀',
    title: 'Zero config install',
    desc: 'One package, zero required configuration. Drop the `EmailBlockEditor` component into any React project.',
  },
];

const CODE_EXAMPLE = `import { EmailBlockEditor, renderEmailDocument, createEmptyDocument } from '@block-based/block-based';
import { useState } from 'react';

export function App() {
  const [doc, setDoc] = useState(createEmptyDocument);

  return (
    <>
      <EmailBlockEditor value={doc} onChange={setDoc} height="600px" />
      <pre>{renderEmailDocument(doc)}</pre>
    </>
  );
}`;

export default function LandingPage() {
  const [doc, setDoc] = useState<EmailDocument>(createEmptyDocument);
  const handleChange = useCallback((next: EmailDocument) => setDoc(next), []);

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <span style={S.logoAccent}>&#x2B61;</span> Block Based
        </div>
        <div style={S.navLinks}>
          <a style={S.navLink} onClick={scrollToDemo}>Demo</a>
          <a style={S.navLink} href="https://github.com/monokaijs/block-based" target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div style={S.navSpacer} />
        <button style={S.ctaBtn} onClick={scrollToDemo}>Try it live</button>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.badge}>Open Source · MIT License</div>
        <h1 style={S.heading}>
          Email block editor for&nbsp;
          <span style={{ color: C.accent }}>React</span>
        </h1>
        <p style={S.sub}>
          A headless, composable email builder. Design beautiful, email-client-safe
          HTML emails visually — no drag-and-drop library required.
        </p>
        <div style={S.heroBtns}>
          <button style={S.primaryBtn} onClick={scrollToDemo}>Try the demo</button>
          <a href="https://github.com/monokaijs/block-based" target="_blank" rel="noreferrer">
            <button style={S.secondaryBtn}>View on GitHub</button>
          </a>
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" style={S.demoSection}>
        <span style={S.demoLabel}>Live demo — try editing below</span>
        <div style={S.demoWrapper}>
          <EmailBlockEditor value={doc} onChange={handleChange} height="100%" />
        </div>
      </section>

      {/* Features */}
      <section style={S.features}>
        <div style={S.featuresInner}>
          <h2 style={S.featuresTitle}>Everything you need</h2>
          <div style={S.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} style={S.featureCard}>
                <div style={S.featureIcon}>{f.icon}</div>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code snippet */}
      <section style={S.code}>
        <div style={S.codeInner}>
          <h2 style={S.codeTitle}>Up in minutes</h2>
          <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
            Install from npm, drop the component in, and start building.
          </p>
          <pre style={S.codeBlock}>{CODE_EXAMPLE}</pre>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        Block Based &mdash; MIT License &mdash;{' '}
        <a href="https://github.com/monokaijs/block-based" target="_blank" rel="noreferrer" style={{ color: C.accent }}>
          github.com/monokaijs/block-based
        </a>
      </footer>
    </div>
  );
}
