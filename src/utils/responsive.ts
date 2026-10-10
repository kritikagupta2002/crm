import { useWindowDimensions, ViewStyle } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isSmall: boolean; // < 360px (iPhone SE 1st gen, small Android phones 320-359px)
  isCompact: boolean; // <= 375px (iPhone mini/SE, compact Androids)
  isStandard: boolean; // 376px - 427px (iPhone 12/13/14/15/16 standard, Galaxy S21-S24)
  isLarge: boolean; // 428px - 599px (iPhone Plus/Pro Max, Galaxy Ultra)
  isTablet: boolean; // >= 600px (iPads, Android tablets, foldables unfolded)
  isLandscape: boolean;
  contentPadding: number; // 12px for small, 16px standard, 24px for tablet
  cardPadding: number; // 12px for small, 14px standard, 18px for tablet
  contentMaxWidth?: number; // 720px for tablet, undefined for phones
  containerStyle: ViewStyle;
  scaleFont: (baseSize: number, minSize?: number) => number;
  scaleSize: (baseSize: number, factor?: number) => number;
  getGridItemWidth: (columns: number, gap: number, horizontalPadding?: number) => number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 360;
  const isCompact = width <= 375;
  const isTablet = width >= 600;
  const isLarge = width >= 428 && width < 600;
  const isStandard = width > 375 && width < 428;
  const isLandscape = width > height;

  const contentPadding = isSmall ? 10 : isCompact ? 12 : isTablet ? 24 : 16;
  const cardPadding = isSmall ? 10 : isCompact ? 12 : isTablet ? 18 : 14;
  const contentMaxWidth = isTablet ? 720 : undefined;

  const scaleFont = (baseSize: number, minSize?: number): number => {
    const min = minSize ?? Math.round(baseSize * 0.75);
    if (isSmall) return Math.max(min, Math.round(baseSize * 0.86));
    if (isCompact) return Math.max(min, Math.round(baseSize * 0.92));
    if (isTablet) return Math.round(baseSize * 1.06);
    return baseSize;
  };

  const scaleSize = (baseSize: number, factor: number = 0.88): number => {
    if (isSmall) return Math.round(baseSize * factor);
    if (isCompact) return Math.round(baseSize * 0.94);
    if (isTablet) return Math.round(baseSize * 1.08);
    return baseSize;
  };

  const getGridItemWidth = (columns: number, gap: number, horizontalPadding: number = contentPadding): number => {
    const activeWidth = isTablet ? Math.min(width, 720) : width;
    const usableWidth = activeWidth - horizontalPadding * 2;
    const totalGap = gap * Math.max(1, columns - 1);
    return Math.max(0, Math.floor((usableWidth - totalGap) / columns));
  };

  const containerStyle: ViewStyle = isTablet
    ? {
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
      }
    : {
        width: '100%',
      };

  return {
    width,
    height,
    isSmall,
    isCompact,
    isStandard,
    isLarge,
    isTablet,
    isLandscape,
    contentPadding,
    cardPadding,
    contentMaxWidth,
    containerStyle,
    scaleFont,
    scaleSize,
    getGridItemWidth,
  };
}

/**
 * Calculates exact column width in pixels rounded down to avoid
 * subpixel layout wrapping bugs on narrow mobile screens.
 */
export function getResponsiveGridWidth(
  containerWidth: number,
  columns: number,
  gap: number,
  padding: number = 0
): number {
  const usableWidth = containerWidth - padding * 2;
  const totalGap = gap * Math.max(1, columns - 1);
  return Math.max(0, Math.floor((usableWidth - totalGap) / columns));
}
