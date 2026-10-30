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
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1.5,
  },
  md: {
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2.5,
  },
  lg: {
    shadowColor: '#0f2a3d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
};

/* Same palette as the web CRM: deep teal and gold on a cool grey ground, navy ink. */
export const colors = {
  white: '#ffffff',
  black: '#000000',

  primary: '#1f6f78', // teal 700
  primaryLight: '#2a8089', // teal 600
  primaryDark: '#0e4a52', // teal 900
  primaryBg: '#eef7f7', // teal 50
  primaryMuted: '#ddefef', // teal 100

  gold: '#c8943a',
  goldDark: '#b07d27',
  goldBg: '#f7ebd5',
  goldLight: '#ecd6ae',

  accent: '#c8943a', // gold
  accentLight: '#ecd6ae',
  accentDark: '#b07d27',
  accentBg: '#f7ebd5',

  success: '#2e9e6b',
  successLight: '#bfe3d0',
  successBg: '#e3f4ec',
  successText: '#237a53',

  warning: '#c27a12',
  warningLight: '#ecd6ae',
  warningBg: '#fcf0dc',
  warningText: '#9a5f0c',

  danger: '#d24c47',
  dangerLight: '#f2c4c2',
  dangerBg: '#fbe5e4',
  dangerText: '#a83a36',

  info: '#2f6fb3',
  infoLight: '#c9dcf1',
  infoBg: '#e6effa',
  infoText: '#245a93',

  surface: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceMuted: '#f4f7f8',
  surfaceSubtle: '#edf1f3',

  borderLight: '#edf1f3',
  borderMedium: '#e1e8eb',
  borderDark: '#d3dce1',

  textPrimary: '#0f2a3d', // ink
  textSecondary: '#4a5b68',
  textMuted: '#627079',
  textTertiary: '#7c8b96',
  textInverse: '#ffffff',
  backdrop: 'rgba(15, 42, 61, 0.45)',

  background: {
    primary: '#f4f7f8',
    secondary: '#ffffff',
    tertiary: '#edf1f3',
    card: '#ffffff',
    light: '#ffffff',
  },
  border: {
    default: '#e1e8eb',
    subtle: '#edf1f3',
    highlight: '#1f6f78',
    light: '#f4f7f8',
    medium: '#e1e8eb',
  },
  text: {
    primary: '#0f2a3d',
    secondary: '#4a5b68',
    tertiary: '#627079',
    inverse: '#ffffff',
  },
  semantic: {
    success: '#2e9e6b',
    warning: '#c27a12',
    danger: '#d24c47',
    error: '#d24c47',
    info: '#2f6fb3',
  },
  geo: {
    darkBlue: '#0f2a3d',
    navy: '#12303e',
    slate: '#1f4555',
    deep: '#0b2230',
    earth: '#b07d27',
    sandstone: '#9a5f0c',
    ochre: '#c27a12',
    gold: '#c8943a',
    goldMuted: '#f7ebd5',
    warmWhite: '#fbfaf7',
    contourBorder: '#d3dce1',
  },
  // One colour per workspace, kept inside the teal / gold / ink family.
  workspaces: {
    crm: '#1f6f78',
    erm: '#2a8089',
    vendor: '#b07d27',
    documents: '#3d5a6c',
    hrms: '#2e9e6b',
    expenses: '#c27a12',
    finance: '#0e4a52',
    mis: '#2f6fb3',
    field_database: '#8a5a14',
  },
};

/* Fraunces for titles and figures, as on the web CRM; the system font for everything else. */
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  serifRegular: 'Fraunces_400Regular',
};
