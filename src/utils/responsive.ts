import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isCompact: boolean; // < 360px (iPhone SE 1st gen, small Android phones: 320-359px)
  isStandard: boolean; // 360px - 413px (standard smartphones: iPhone 12/13/14/15, Galaxy S21-S24)
  isLarge: boolean; // 414px - 599px (large phablets: Pro Max, Plus, Galaxy Ultra)
  isTablet: boolean; // >= 600px (tablets, unfolded foldables)
  contentPadding: number; // 12px for compact, 16px standard, 20px for tablet
  contentMaxWidth?: number; // 680px for tablet, undefined for phones
  scaleFont: (baseSize: number) => number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 360;
  const isTablet = width >= 600;
  const isLarge = width >= 414 && width < 600;
  const isStandard = width >= 360 && width < 414;

  const contentPadding = isCompact ? 12 : isTablet ? 20 : 16;
  const contentMaxWidth = isTablet ? 680 : undefined;

  const scaleFont = (baseSize: number): number => {
    if (isCompact) return Math.max(10, Math.round(baseSize * 0.92));
    if (isTablet) return Math.round(baseSize * 1.05);
    return baseSize;
  };

  return {
    width,
    height,
    isCompact,
    isStandard,
    isLarge,
    isTablet,
    contentPadding,
    contentMaxWidth,
    scaleFont,
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
