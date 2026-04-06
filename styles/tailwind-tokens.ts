// ──────────────────────────────────────────────────────────────
// Tailwind token bridge
// Reads from the master tokens file and re-exports a shape
// that drops straight into tailwind.config.ts → theme.extend.
// ──────────────────────────────────────────────────────────────

import { tokens } from './tokens'

const t = tokens

/** Helper to create a fontSize tuple Tailwind understands */
const fs = (size: string, config: { lineHeight: string; letterSpacing: string }) =>
  [size, config] as [string, { lineHeight: string; letterSpacing: string }]

export const tailwindTokens = {
  // ── Colors ────────────────────────────────────────────────
  colors: {
    // Primitive scales
    navy: {
      50: t.primitive.navy[50],
      100: t.primitive.navy[100],
      600: t.primitive.navy[600],
      700: t.primitive.navy[700],
      800: t.primitive.navy[800],
      900: t.primitive.navy[900],
      950: t.primitive.navy[950],
    },
    gold: {
      50: t.primitive.gold[50],
      100: t.primitive.gold[100],
      400: t.primitive.gold[400],
      600: t.primitive.gold[600],
      800: t.primitive.gold[800],
      900: t.primitive.gold[900],
    },
    ivory: {
      50: t.primitive.ivory[50],
      100: t.primitive.ivory[100],
      200: t.primitive.ivory[200],
    },

    // Semantic aliases
    brand:           t.color.brand.primary,
    'brand-dark':    t.color.brand.primaryDark,
    'brand-mid':     t.color.brand.primaryMid,
    'brand-light':   t.color.brand.primaryLight,
    'brand-pale':    t.color.brand.primaryPale,
    accent:          t.color.brand.accent,
    'accent-light':  t.color.brand.accentLight,
    'accent-bright': t.color.brand.accentBright,
    'accent-pale':   t.color.brand.accentPale,

    // Background shortcuts
    page:       t.color.bg.page,
    'page-alt': t.color.bg.pageAlt,
    card:       t.color.bg.card,
    dark:       t.color.bg.dark,
    'dark-mid': t.color.bg.darkMid,
    'navy-tint': t.color.bg.navyTint,
    'gold-tint': t.color.bg.goldTint,

    // Text shortcuts
    'text-primary':      t.color.text.primary,
    'text-secondary':    t.color.text.secondary,
    'text-hint':         t.color.text.hint,
    'text-on-dark':      t.color.text.onDark,
    'text-on-dark-muted': t.color.text.onDarkMuted,
    'text-on-dark-hint': t.color.text.onDarkHint,
    'text-brand':        t.color.text.brand,
    'text-accent':       t.color.text.accent,
    'text-accent-on-dark': t.color.text.accentOnDark,

    // Border shortcuts
    'border-default': t.color.border.default,
    'border-light':   t.color.border.light,
    'border-strong':  t.color.border.strong,
    'border-brand':   t.color.border.brand,
    'border-accent':  t.color.border.accent,
    'border-on-dark': t.color.border.onDark,
  },

  // ── Font family ───────────────────────────────────────────
  fontFamily: {
    display: [t.font.family.display, 'serif'],
    label:   [t.font.family.label, 'serif'],
    body:    [t.font.family.body, 'sans-serif'],
    sans:    [t.font.family.body, 'sans-serif'],
  },

  // ── Font size (with paired lineHeight & letterSpacing) ────
  fontSize: {
    hero:       fs(t.font.size.hero,     { lineHeight: t.font.leading.tight,  letterSpacing: t.font.tracking.tight }),
    'hero-md':  fs(t.font.size.heroMd,   { lineHeight: t.font.leading.tight,  letterSpacing: t.font.tracking.tight }),
    'hero-sm':  fs(t.font.size.heroSm,   { lineHeight: t.font.leading.tight,  letterSpacing: t.font.tracking.tight }),
    display:    fs(t.font.size.display,   { lineHeight: t.font.leading.tight,  letterSpacing: t.font.tracking.tight }),
    h1:         fs(t.font.size.h1,        { lineHeight: t.font.leading.snug,   letterSpacing: t.font.tracking.tight }),
    h2:         fs(t.font.size.h2,        { lineHeight: t.font.leading.snug,   letterSpacing: t.font.tracking.normal }),
    h3:         fs(t.font.size.h3,        { lineHeight: t.font.leading.snug,   letterSpacing: t.font.tracking.normal }),
    h4:         fs(t.font.size.h4,        { lineHeight: t.font.leading.snug,   letterSpacing: t.font.tracking.normal }),
    h5:         fs(t.font.size.h5,        { lineHeight: t.font.leading.snug,   letterSpacing: t.font.tracking.normal }),
    label:      fs(t.font.size.label,     { lineHeight: t.font.leading.normal,  letterSpacing: t.font.tracking.label }),
    'label-lg': fs(t.font.size.labelLg,   { lineHeight: t.font.leading.normal, letterSpacing: t.font.tracking.label }),
    body:       fs(t.font.size.body,      { lineHeight: t.font.leading.normal,  letterSpacing: t.font.tracking.normal }),
    'body-lg':  fs(t.font.size.bodyLg,    { lineHeight: t.font.leading.relaxed, letterSpacing: t.font.tracking.normal }),
    small:      fs(t.font.size.small,     { lineHeight: t.font.leading.normal,  letterSpacing: t.font.tracking.normal }),
    caption:    fs(t.font.size.caption,   { lineHeight: t.font.leading.normal,  letterSpacing: t.font.tracking.normal }),
    micro:      fs(t.font.size.micro,     { lineHeight: t.font.leading.normal,  letterSpacing: t.font.tracking.normal }),
  },

  // ── Letter spacing ───────────────────────────────────────
  letterSpacing: {
    tight:   t.font.tracking.tight,
    normal:  t.font.tracking.normal,
    label:   t.font.tracking.label,
    wide:    t.font.tracking.wide,
    widest:  t.font.tracking.widest,
  },

  // ── Border radius ────────────────────────────────────────
  borderRadius: {
    none: t.border.radius.none,
    sm:   t.border.radius.sm,
    md:   t.border.radius.md,
    lg:   t.border.radius.lg,
    xl:   t.border.radius.xl,
    full: t.border.radius.full,
  },

  // ── Box shadow ───────────────────────────────────────────
  boxShadow: {
    none:  t.shadow.none,
    sm:    t.shadow.sm,
    card:  t.shadow.card,
    hover: t.shadow.hover,
    navy:  t.shadow.navy,
    gold:  t.shadow.gold,
    focus: t.shadow.focus,
  },

  // ── Transition duration ──────────────────────────────────
  transitionDuration: {
    instant: t.motion.duration.instant,
    fast:    t.motion.duration.fast,
    normal:  t.motion.duration.normal,
    slow:    t.motion.duration.slow,
    reveal:  t.motion.duration.reveal,
    counter: t.motion.duration.counter,
  },

  // ── Transition timing function ───────────────────────────
  transitionTimingFunction: {
    default: t.motion.easing.default,
    in:      t.motion.easing.in,
    out:     t.motion.easing.out,
    spring:  t.motion.easing.spring,
  },

  // ── Animations ───────────────────────────────────────────
  animation: {
    'fade-up': `fadeUp ${t.motion.duration.reveal} ${t.motion.easing.out} forwards`,
    'fade-in': `fadeIn ${t.motion.duration.reveal} ${t.motion.easing.out} forwards`,
  },

  keyframes: {
    fadeUp: {
      '0%':   { opacity: '0', transform: 'translateY(16px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    fadeIn: {
      '0%':   { opacity: '0' },
      '100%': { opacity: '1' },
    },
  },

  // ── Z-index ──────────────────────────────────────────────
  zIndex: {
    below:    String(t.zIndex.below),
    base:     String(t.zIndex.base),
    raised:   String(t.zIndex.raised),
    dropdown: String(t.zIndex.dropdown),
    sticky:   String(t.zIndex.sticky),
    overlay:  String(t.zIndex.overlay),
    modal:    String(t.zIndex.modal),
    toast:    String(t.zIndex.toast),
  },

  // ── Max width ────────────────────────────────────────────
  maxWidth: {
    container: t.space.container.maxW,
  },
}
