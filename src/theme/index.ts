export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const borderRadius = radius;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const typography = {
  fontSizes: {
    xxs: 10,
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 26,
    huge: 32,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800' as const,
  },
  h2: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  h4: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
  },
  titleLarge: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const colors = {
  // Primitives
  white: '#ffffff',
  black: '#000000',

  // Brand colors (plain primitive strings)
  primary: '#10b981', // Emerald
  primaryLight: '#34d399',
  primaryDark: '#059669',
  primaryBg: '#064e3b',

  accent: '#0d9488',
  accentLight: '#14b8a6',
  accentBg: '#f0fdfa',

  // Semantic flat
  success: '#10b981',
  successLight: '#34d399',
  successBg: '#064e3b',
  successText: '#34d399',

  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningBg: '#78350f',
  warningText: '#fbbf24',

  danger: '#ef4444',
  dangerLight: '#f87171',
  dangerBg: '#7f1d1d',
  dangerText: '#f87171',

  info: '#0284c7',
  infoLight: '#38bdf8',
  infoBg: '#0c4a6e',
  infoText: '#38bdf8',

  // Surfaces & backgrounds flat
  surface: '#1e293b',
  surfaceCard: '#1e293b',
  surfaceElevated: '#1e293b',
  surfaceMuted: '#334155',

  // Borders flat
  borderLight: '#334155',
  borderMedium: '#475569',
  borderDark: '#1e293b',

  // Text flat
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#ffffff',
  backdrop: 'rgba(15, 23, 42, 0.7)',

  // Pure nested objects
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    card: '#1e293b',
    light: '#f8fafc',
  },
  border: {
    default: '#334155',
    subtle: '#1e293b',
    highlight: '#10b981',
    light: '#334155',
    medium: '#475569',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    inverse: '#0f172a',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    error: '#ef4444',
    info: '#3b82f6',
  },
};
