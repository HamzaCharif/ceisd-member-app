// /mobile/theme/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// CEISD DESIGN SYSTEM
// The single source of truth for all visual styling in the mobile app.
//
// Why this exists: screens were hardcoding hex values and magic numbers
// (e.g. '#F5F5F5', padding: 16). That made the app inconsistent and "basic".
// Import these tokens instead of hardcoding ANY color, size, spacing, font,
// radius, or shadow. One place to change = the whole app stays consistent.
//
// It EXTENDS shared/constants COLORS (does not replace them) so nothing breaks.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform, TextStyle, ViewStyle } from 'react-native';
import { COLORS as BASE_COLORS } from '../../shared/constants';

// ─────────────────────────────────────────────
// COLOR PALETTE  (extends shared/constants)
// ─────────────────────────────────────────────

export const colors = {
  ...BASE_COLORS,

  // Brand greens (primary scale)
  primary: '#1D9E75',
  primaryDark: '#157A5A',
  primaryDarker: '#0F5C43',
  primaryLight: '#E8F7F2',
  primaryTint: '#F2FBF8',

  // Navy scale (headings, dark surfaces, the admin-like accents)
  navy: '#1A2744',
  navyLight: '#2A3A5C',
  navyTint: '#EEF1F6',

  // Neutrals
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFCFD',
  cardBackground: '#FFFFFF',
  overlay: 'rgba(16, 24, 40, 0.45)',

  // Text
  textPrimary: '#101828',
  textSecondary: '#667085',
  textTertiary: '#98A2B3',
  textOnDark: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Lines & fills
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  divider: '#F2F4F7',

  // Semantic
  success: '#1D9E75',
  successLight: '#E8F7F2',
  warning: '#F59E0B',
  warningLight: '#FEF6E7',
  error: '#D92D20',
  errorLight: '#FEF3F2',
  info: '#378ADD',
  infoLight: '#EAF2FC',

  // Misc
  shadow: '#101828',
  stageLocked: '#D0D5DD',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────
// SPACING  (4px base scale — use everywhere)
// ─────────────────────────────────────────────

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  full: 9999,
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// fontFamily is centralized so you can swap in a custom font in ONE place.
// To add a real display font later (recommended) install e.g.
//   npx expo install @expo-google-fonts/sora expo-font
// load it at app start, then set fonts.display = 'Sora_700Bold'.
// Until then it falls back to the platform system font (safe, no build risk).
// ─────────────────────────────────────────────

export const fonts = {
  display: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

type TypeToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'>;

export const type: Record<string, TypeToken> = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  bodyLg: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontFamily: fonts.body, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
};

// ─────────────────────────────────────────────
// ELEVATION / SHADOWS
// Cross-platform: boxShadow on web (the fix you already learned),
// native shadow props on iOS, elevation on Android.
// ─────────────────────────────────────────────

type ShadowLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const SHADOW_CONFIG: Record<Exclude<ShadowLevel, 'none'>, { y: number; blur: number; opacity: number; elev: number }> = {
  sm: { y: 1, blur: 3, opacity: 0.06, elev: 1 },
  md: { y: 4, blur: 12, opacity: 0.08, elev: 3 },
  lg: { y: 8, blur: 24, opacity: 0.1, elev: 6 },
  xl: { y: 16, blur: 40, opacity: 0.14, elev: 12 },
};

export function elevation(level: ShadowLevel = 'md'): ViewStyle {
  if (level === 'none') return {};
  const c = SHADOW_CONFIG[level];
  return (
    Platform.select<ViewStyle>({
      web: { boxShadow: `0px ${c.y}px ${c.blur}px rgba(16, 24, 40, ${c.opacity})` } as ViewStyle,
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: c.y },
        shadowOpacity: c.opacity,
        shadowRadius: c.blur / 2,
      },
      android: { elevation: c.elev },
      default: {},
    }) ?? {}
  );
}

// ─────────────────────────────────────────────
// HIT SLOP & ANIMATION
// ─────────────────────────────────────────────

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const motion = {
  pressedOpacity: 0.85,
  pressedScale: 0.97,
  durationFast: 120,
  durationBase: 220,
} as const;

// ─────────────────────────────────────────────
// CONVENIENCE EXPORT
// ─────────────────────────────────────────────

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  type,
  elevation,
  hitSlop,
  motion,
} as const;

export default theme;
