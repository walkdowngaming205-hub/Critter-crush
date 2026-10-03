import { Platform } from 'react-native';

export const colors = {
  bg: '#FFF8F0',
  board: '#FFF5E6',
  boardBorder: '#F3DFC1',
  coral: '#FF6B6B',
  violet: '#A855F7',
  mint: '#34D399',
  sky: '#38BDF8',
  amber: '#FBBF24',
  orange: '#F97316',
  gold: '#F59E0B',
  text: '#3B2F4A',
  textMuted: '#6F6380',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  grayLight: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
};

export const gradients = {
  primary: ['#FF6B6B', '#A855F7'] as const,
  daily: ['#FBBF24', '#F97316'] as const,
  home: ['#FFDDD2', '#E2D1F9'] as const,
  map: ['#D1FAE5', '#BAE6FD'] as const,
  festive: ['#FDE68A', '#FF8A8A'] as const,
  sad: ['#E9E3F5', '#D8CFEA'] as const,
  screen: ['#FFF1E6', '#F3E8FF'] as const,
  gameplay: ['#FFE8D6', '#EDE4FF', '#D9F7EA'] as const,
  gold: ['#FDE68A', '#F59E0B'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };

const withFallback = (name: string): string =>
  Platform.OS === 'web' ? `${name}, Arial, sans-serif` : name;

/** Unknown font families fall back to the system font on every platform, so text never disappears. */
export const fonts = {
  display: withFallback('FredokaOne_400Regular'),
  body: withFallback('Nunito_400Regular'),
  bold: withFallback('Nunito_700Bold'),
  heavy: withFallback('Nunito_800ExtraBold'),
};

export const shadow = Platform.select({
  ios: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
  android: { elevation: 4 },
  default: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
}) as object;
