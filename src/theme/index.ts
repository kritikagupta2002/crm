export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
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
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  titleSmall: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  labelLarge: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  labelMedium: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};

export const shadows = {
  xs: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1.5,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2.5,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const colors = {
  white: '#ffffff',
  black: '#000000',

  primary: '#0d9488', // Teal 600
  primaryLight: '#14b8a6', // Teal 500
  primaryDark: '#0f766e', // Teal 700
  primaryBg: '#f0fdfa', // Teal 50
  primaryMuted: '#ccfbf1', // Teal 100

  accent: '#0284c7', // Sky 600
  accentLight: '#38bdf8', // Sky 400
  accentDark: '#0369a1', // Sky 700
  accentBg: '#f0f9ff', // Sky 50

  success: '#059669', // Emerald 600
  successLight: '#a7f3d0', // Emerald 200
  successBg: '#ecfdf5', // Emerald 50
  successText: '#047857', // Emerald 700

  warning: '#d97706', // Amber 600
  warningLight: '#fde68a', // Amber 200
  warningBg: '#fffbeb', // Amber 50
  warningText: '#b45309', // Amber 700

  danger: '#dc2626', // Red 600
  dangerLight: '#fecaca', // Red 200
  dangerBg: '#fef2f2', // Red 50
  dangerText: '#b91c1c', // Red 700

  info: '#0284c7', // Sky 600
  infoLight: '#bae6fd', // Sky 200
  infoBg: '#f0f9ff', // Sky 50
  infoText: '#0369a1', // Sky 700

  surface: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceSubtle: '#f1f5f9',

  borderLight: '#f1f5f9',
  borderMedium: '#e2e8f0',
  borderDark: '#cbd5e1',

  textPrimary: '#0f172a', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#64748b', // Slate 500
  textTertiary: '#94a3b8', // Slate 400
  textInverse: '#ffffff',
  backdrop: 'rgba(15, 23, 42, 0.45)',

  background: {
    primary: '#f8fafc', // Slate 50 clean light background
    secondary: '#ffffff',
    tertiary: '#f1f5f9',
    card: '#ffffff',
    light: '#ffffff',
  },
  border: {
    default: '#e2e8f0', // Clean subtle border
    subtle: '#f1f5f9',
    highlight: '#0d9488',
    light: '#f8fafc',
    medium: '#e2e8f0',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    inverse: '#ffffff',
  },
  semantic: {
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    error: '#dc2626',
    info: '#0284c7',
  },
  geo: {
    darkBlue: '#0b2545',
    navy: '#133a68',
    slate: '#1e3a5f',
    deep: '#0a1d37',
    earth: '#c28b38',
    sandstone: '#b45309',
    ochre: '#d97706',
    gold: '#f59e0b',
    goldMuted: '#fef3c7',
    warmWhite: '#fdfcfb',
    contourBorder: '#cbd5e1',
  },
  workspaces: {
    crm: '#2563eb',
    erm: '#0d9488',
    vendor: '#d97706',
    documents: '#7c3aed',
    hrms: '#059669',
    expenses: '#ea580c',
    finance: '#0f766e',
    mis: '#db2777',
    field_database: '#9a3412',
  },
};
