import * as fs from 'fs'
import * as path from 'path'
import { tokens } from '../styles/tokens'

const css = `:root {
  /* ── Brand colors ──────────────────────────────────────────── */
  --color-brand: ${tokens.color.brand.primary};
  --color-brand-dark: ${tokens.color.brand.primaryDark};
  --color-brand-mid: ${tokens.color.brand.primaryMid};
  --color-brand-pale: ${tokens.color.brand.primaryPale};
  --color-accent: ${tokens.color.brand.accent};
  --color-accent-light: ${tokens.color.brand.accentLight};
  --color-accent-pale: ${tokens.color.brand.accentPale};

  /* ── Background colors ─────────────────────────────────────── */
  --color-bg-page: ${tokens.color.bg.page};
  --color-bg-page-alt: ${tokens.color.bg.pageAlt};
  --color-bg-card: ${tokens.color.bg.card};
  --color-bg-dark: ${tokens.color.bg.dark};
  --color-bg-dark-mid: ${tokens.color.bg.darkMid};
  --color-bg-navy-tint: ${tokens.color.bg.navyTint};
  --color-bg-gold-tint: ${tokens.color.bg.goldTint};

  /* ── Text colors ────────────────────────────────────────────── */
  --color-text-primary: ${tokens.color.text.primary};
  --color-text-secondary: ${tokens.color.text.secondary};
  --color-text-hint: ${tokens.color.text.hint};
  --color-text-on-dark: ${tokens.color.text.onDark};
  --color-text-on-dark-muted: ${tokens.color.text.onDarkMuted};
  --color-text-on-dark-hint: ${tokens.color.text.onDarkHint};
  --color-text-brand: ${tokens.color.text.brand};
  --color-text-accent: ${tokens.color.text.accent};
  --color-text-accent-dark: ${tokens.color.text.accentOnDark};

  /* ── Border colors ──────────────────────────────────────────── */
  --color-border-default: ${tokens.color.border.default};
  --color-border-light: ${tokens.color.border.light};
  --color-border-strong: ${tokens.color.border.strong};
  --color-border-brand: ${tokens.color.border.brand};
  --color-border-accent: ${tokens.color.border.accent};
  --color-border-on-dark: ${tokens.color.border.onDark};

  /* ── Typography ─────────────────────────────────────────────── */
  --font-display: '${tokens.font.family.display}', serif;
  --font-label: '${tokens.font.family.label}', serif;
  --font-body: '${tokens.font.family.body}', sans-serif;

  /* ── Spacing ────────────────────────────────────────────────── */
  --space-section-y: ${tokens.space.section.y};
  --space-section-y-sm: ${tokens.space.section.ySm};
  --space-px: ${tokens.space.container.px};
  --space-px-sm: ${tokens.space.container.pxSm};
  --space-card: ${tokens.space.component.cardPad};
  --space-gap: ${tokens.space.component.cardGap};

  /* ── Radius ─────────────────────────────────────────────────── */
  --radius-sm: ${tokens.border.radius.sm};
  --radius-md: ${tokens.border.radius.md};
  --radius-lg: ${tokens.border.radius.lg};
  --radius-xl: ${tokens.border.radius.xl};
  --radius-full: ${tokens.border.radius.full};

  /* ── Shadows ────────────────────────────────────────────────── */
  --shadow-card: ${tokens.shadow.card};
  --shadow-hover: ${tokens.shadow.hover};
  --shadow-navy: ${tokens.shadow.navy};
  --shadow-focus: ${tokens.shadow.focus};

  /* ── Motion ─────────────────────────────────────────────────── */
  --duration-fast: ${tokens.motion.duration.fast};
  --duration-normal: ${tokens.motion.duration.normal};
  --duration-slow: ${tokens.motion.duration.slow};
  --duration-reveal: ${tokens.motion.duration.reveal};
  --ease-default: ${tokens.motion.easing.default};
  --ease-spring: ${tokens.motion.easing.spring};

  /* ── Z-index ────────────────────────────────────────────────── */
  --z-sticky: ${tokens.zIndex.sticky};
  --z-overlay: ${tokens.zIndex.overlay};
  --z-modal: ${tokens.zIndex.modal};
  --z-toast: ${tokens.zIndex.toast};
}
`

const outPath = path.resolve(__dirname, '..', 'styles', 'tokens.css')
fs.writeFileSync(outPath, css, 'utf-8')
console.log(`[generate-tokens] wrote ${outPath}`)
