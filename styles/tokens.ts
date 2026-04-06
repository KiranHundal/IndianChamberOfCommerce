// ──────────────────────────────────────────────────────────────
// CVICC Design Token System
// Single source of truth for every visual value in the project.
// ──────────────────────────────────────────────────────────────

export const tokens = {
  // ── Layer 1: Primitive tokens ──────────────────────────────
  primitive: {
    navy: {
      950: '#081830', 900: '#0F2447', 800: '#1B3A6B', 700: '#254D8A',
      600: '#3A6AAF', 100: '#EEF3FB', 50: '#F5F8FD',
    },
    gold: {
      900: '#8A6D04', 800: '#B8960C', 600: '#D4AC2A', 400: '#F0C040',
      100: '#FBF6E4', 50: '#FEFCF5',
    },
    ivory: { 200: '#EDE4D0', 100: '#F5EFE0', 50: '#FAF7F2' },
    neutral: {
      900: '#2C2C2C', 700: '#3D3D3D', 600: '#5A5550', 400: '#9A9490',
      200: '#D5D1CB', '000': '#FFFFFF',
    },
  },

  // ── Layer 2: Semantic color tokens ─────────────────────────
  color: {
    brand: {
      primary: '#1B3A6B', primaryDark: '#0F2447', primaryMid: '#254D8A',
      primaryLight: '#3A6AAF', primaryPale: '#EEF3FB',
      accent: '#B8960C', accentLight: '#D4AC2A', accentBright: '#F0C040', accentPale: '#FBF6E4',
    },
    bg: {
      page: '#F5EFE0', pageAlt: '#FAF7F2', card: '#FFFFFF',
      dark: '#0F2447', darkMid: '#1B3A6B', navyTint: '#EEF3FB', goldTint: '#FBF6E4',
    },
    text: {
      primary: '#2C2C2C', secondary: '#5A5550', hint: '#9A9490',
      onDark: '#FFFFFF', onDarkMuted: 'rgba(255,255,255,0.55)',
      onDarkHint: 'rgba(255,255,255,0.35)', brand: '#1B3A6B',
      accent: '#B8960C', accentOnDark: '#D4AC2A',
    },
    border: {
      default: '#EDE4D0', light: '#D5D1CB', strong: '#9A9490',
      brand: '#1B3A6B', accent: '#B8960C', onDark: 'rgba(255,255,255,0.12)',
    },
  },

  // ── Layer 3: Typography tokens ─────────────────────────────
  font: {
    family: { display: 'Cormorant Garamond', label: 'Cinzel', body: 'DM Sans' },
    size: {
      hero: '5.5rem', heroMd: '4rem', heroSm: '3rem', display: '3.5rem',
      h1: '3rem', h2: '2.25rem', h3: '1.75rem', h4: '1.375rem', h5: '1.125rem',
      label: '0.6875rem', labelLg: '0.8125rem',
      body: '0.9375rem', bodyLg: '1.0625rem', small: '0.8125rem',
      caption: '0.75rem', micro: '0.6875rem',
    },
    weight: { light: 300, regular: 400, medium: 500, semibold: 600 },
    tracking: { tight: '-0.01em', normal: '0em', label: '0.20em', wide: '0.30em', widest: '0.45em' },
    leading: { tight: '0.95', snug: '1.15', normal: '1.60', relaxed: '1.80' },
  },

  // ── Layer 4: Spacing tokens ────────────────────────────────
  space: {
    section: { y: '6rem', yMd: '4rem', ySm: '3rem' },
    container: { maxW: '75rem', px: '2rem', pxMd: '1.5rem', pxSm: '1.25rem' },
    component: { cardPad: '1.5rem', cardGap: '1rem', gridGap: '1.25rem', gridGapLg: '1.5rem' },
  },

  // ── Layer 5: Border & radius tokens ───────────────────────
  border: {
    radius: { none: '0', sm: '0.1875rem', md: '0.375rem', lg: '0.625rem', xl: '1rem', full: '9999px' },
    width: { thin: '0.5px', normal: '1px', thick: '2px', accent: '3px', heavy: '4px' },
  },

  // ── Layer 6: Animation tokens ─────────────────────────────
  motion: {
    duration: { instant: '100ms', fast: '150ms', normal: '300ms', slow: '500ms', reveal: '600ms', counter: '2000ms' },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)', in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)', spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    delay: { stagger: 80, section: 100 },
  },

  // ── Layer 7: Shadow tokens ────────────────────────────────
  shadow: {
    none: 'none', sm: '0 1px 2px rgba(27,58,107,0.06)',
    card: '0 1px 3px rgba(27,58,107,0.08), 0 1px 2px rgba(27,58,107,0.04)',
    hover: '0 4px 16px rgba(27,58,107,0.12), 0 2px 4px rgba(27,58,107,0.06)',
    navy: '0 8px 32px rgba(15,36,71,0.24)', gold: '0 4px 20px rgba(184,150,12,0.20)',
    focus: '0 0 0 3px rgba(58,106,175,0.30)',
  },

  // ── Layer 8: System tokens ────────────────────────────────
  breakpoint: { xs: '375px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', xxl: '1536px' },
  zIndex: { below: -1, base: 0, raised: 10, dropdown: 100, sticky: 200, overlay: 300, modal: 400, toast: 500 },
} as const

export type Tokens = typeof tokens
