import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  ImageBackground,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Layers, Sprout, BarChart3 } from 'lucide-react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import { useResponsive } from '../../utils/responsive';

const splashBgImg = require('../../../assets/splash-background.jpg');
const emblemImg = require('../../../assets/bansal-geo-emblem.png');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const { isSmall, isCompact, isTablet } = useResponsive();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState<number>(0);
  const finishedRef = useRef<boolean>(false);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [fadeAnim, onFinish]);

  useEffect(() => {
    // Fade in whole screen quickly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Listen to progress to update live percentage counter
    const listenerId = progressAnim.addListener(({ value }) => {
      setPercent(Math.min(100, Math.round(value * 100)));
    });

    // Animate progress smoothly over 1800ms
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setTimeout(() => {
          handleFinish();
        }, 200);
      }
    });

    // Safety fallback: guaranteed finish after 2200ms
    const fallbackTimer = setTimeout(() => {
      handleFinish();
    }, 2200);

    return () => {
      progressAnim.removeListener(listenerId);
      clearTimeout(fallbackTimer);
    };
  }, [fadeAnim, progressAnim, handleFinish]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleFinish}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={splashBgImg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Vignette Overlay for Crisp Readability across all displays */}
        <View style={styles.darkScrim} />

        <Animated.View
          style={[
            styles.safeContent,
            {
              opacity: fadeAnim,
              paddingTop: Math.max(insets.top + (isSmall ? 18 : 28), 36),
              paddingBottom: Math.max(insets.bottom + 20, 36),
            },
          ]}
        >
          {/* ================= TOP SECTION ================= */}
          <View style={[styles.topSection, isTablet && styles.tabletContainer]}>
            {/* Mountain Emblem */}
            <View style={styles.emblemContainer}>
              <Image
                source={emblemImg}
                style={[
                  styles.emblemImage,
                  isSmall && { width: 110, height: 56 },
                  isTablet && { width: 160, height: 82 },
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Brand Title: BANSAL GEO */}
            <Text
              style={[
                styles.brandTitle,
                isSmall && { fontSize: 26, letterSpacing: 2.8 },
                isCompact && { fontSize: 28, letterSpacing: 3.2 },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              BANSAL GEO
            </Text>

            {/* Subtitle: SOLUTIONS PVT. LTD. */}
            <Text
              style={[
                styles.brandLegal,
                isSmall && { fontSize: 10, letterSpacing: 3 },
                isCompact && { fontSize: 10.5, letterSpacing: 3.5 },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              SOLUTIONS PVT. LTD.
            </Text>

            {/* Metallic Gold Accent Divider */}
            <View style={styles.goldDivider} />

            {/* Tagline: “Geology for a Better Tomorrow” */}
            <Text
              style={[
                styles.tagline,
                isSmall && { fontSize: 14.5, marginBottom: 16 },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              “Geology for a Better Tomorrow”
            </Text>

            {/* 4 Geological Pillars Glass Card */}
            <View style={[styles.pillarsCard, isSmall && { paddingVertical: 10 }]}>
              {/* 1. Exploration */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Svg width={23} height={23} viewBox="0 0 24 24">
                    <Polygon
                      points="12,2 22,20 2,20"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="none"
                      strokeLinejoin="round"
                    />
                    <Line
                      x1="7"
                      y1="13"
                      x2="17"
                      y2="13"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </Svg>
                </View>
                <Text style={[styles.pillarLabel, isSmall && { fontSize: 10 }]}>Exploration</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 2. Resource Management */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Layers size={23} color="#f59e0b" strokeWidth={2} />
                </View>
                <Text style={[styles.pillarLabel, isSmall && { fontSize: 10 }]}>{'Resource\nManagement'}</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 3. Sustainable Solutions */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Sprout size={23} color="#f59e0b" strokeWidth={2} />
                </View>
                <Text style={[styles.pillarLabel, isSmall && { fontSize: 10 }]}>{'Sustainable\nSolutions'}</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 4. A Better Tomorrow */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <BarChart3 size={23} color="#f59e0b" strokeWidth={2} />
                </View>
                <Text style={[styles.pillarLabel, isSmall && { fontSize: 10 }]}>{'A Better\nTomorrow'}</Text>
              </View>
            </View>
          </View>

          {/* ================= BOTTOM SECTION ================= */}
          <View style={[styles.bottomSection, isTablet && styles.tabletContainer]}>
            <View style={styles.progressContainer}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.loadingWorkspaceText}>
                  LOADING YOUR WORKSPACE...
                </Text>
                <Text style={styles.percentageText}>{percent}%</Text>
              </View>

              {/* Centered Smooth Loading Bar */}
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.tapToContinueHint}>Tap anywhere to continue</Text>
          </View>
        </Animated.View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041527',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 21, 39, 0.46)',
  },
  safeContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  tabletContainer: {
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
  },

  /* Top Section */
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emblemImage: {
    width: 135,
    height: 70,
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 31,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3.6,
    textAlign: 'center',
  },
  brandLegal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 4.2,
    marginTop: 4,
    textAlign: 'center',
  },
  goldDivider: {
    width: 44,
    height: 2.5,
    backgroundColor: '#f59e0b',
    borderRadius: 1.5,
    marginTop: 12,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 16.5,
    fontStyle: 'italic',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 22,
    letterSpacing: 0.2,
  },

  /* 4 Pillars Glass Card */
  pillarsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'rgba(7, 24, 46, 0.72)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarIconBox: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  pillarDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },

  /* Bottom Section */
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  progressContainer: {
    width: '88%',
    maxWidth: 340,
    backgroundColor: 'rgba(7, 24, 46, 0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadingWorkspaceText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 2.2,
    flex: 1,
  },
  percentageText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#f59e0b',
    marginLeft: 8,
  },
  progressBarTrack: {
    height: 4.5,
    backgroundColor: 'rgba(51, 65, 85, 0.65)',
    borderRadius: 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2.5,
  },
  tapToContinueHint: {
    fontSize: 10,
    color: 'rgba(203, 213, 225, 0.6)',
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
