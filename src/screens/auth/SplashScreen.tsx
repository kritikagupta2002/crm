import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
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

const splashBgImg = require('../../../assets/splash-background.jpg');
const emblemImg = require('../../../assets/bansal-geo-emblem.png');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width <= 360;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState<number>(0);
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  useEffect(() => {
    // Fade in whole screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Listen to progress to update live percentage counter
    const listenerId = progressAnim.addListener(({ value }) => {
      setPercent(Math.min(100, Math.round(value * 100)));
    });

    // Animate loading bar to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      // Hold 100% briefly, then fade out and finish
      setTimeout(() => {
        if (!hasFinished) {
          setHasFinished(true);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onFinish();
          });
        }
      }, 250);
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, []);

  const handleSkip = () => {
    if (!hasFinished) {
      setHasFinished(true);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  };

  const barTrackWidth = Math.min(width * 0.72, 270);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barTrackWidth],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleSkip}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={splashBgImg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <Animated.View
          style={[
            styles.safeContent,
            {
              opacity: fadeAnim,
              paddingTop: Math.max(insets.top + 115, 170),
              paddingBottom: Math.max(insets.bottom + 30, 48),
            },
          ]}
        >
          {/* ================= TOP SECTION ================= */}
          <View style={styles.topSection}>
            {/* Mountain Emblem */}
            <View style={styles.emblemContainer}>
              <Image
                source={emblemImg}
                style={[styles.emblemImage, isCompact && { width: 115, height: 60 }]}
                resizeMode="contain"
              />
            </View>

            {/* Brand Title: BANSAL GEO */}
            <Text style={[styles.brandTitle, isCompact && { fontSize: 28, letterSpacing: 3 }]}>
              BANSAL GEO
            </Text>

            {/* Subtitle: SOLUTIONS PVT. LTD. */}
            <Text style={[styles.brandLegal, isCompact && { fontSize: 10.5, letterSpacing: 3.5 }]}>
              SOLUTIONS PVT. LTD.
            </Text>

            {/* Metallic Gold Accent Divider */}
            <View style={styles.goldDivider} />

            {/* Tagline: “Geology for a Better Tomorrow” */}
            <Text style={[styles.tagline, isCompact && { fontSize: 15 }]}>
              “Geology for a Better Tomorrow”
            </Text>

            {/* 4 Geological Pillars Row */}
            <View style={styles.pillarsRow}>
              {/* 1. Exploration */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Svg width={25} height={25} viewBox="0 0 24 24">
                    <Polygon
                      points="12,2 22,20 2,20"
                      stroke="#f59e0b"
                      strokeWidth="1.9"
                      fill="none"
                      strokeLinejoin="round"
                    />
                    <Line
                      x1="7"
                      y1="13"
                      x2="17"
                      y2="13"
                      stroke="#f59e0b"
                      strokeWidth="1.9"
                    />
                  </Svg>
                </View>
                <Text style={styles.pillarLabel}>Exploration</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 2. Resource Management */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Layers size={25} color="#f59e0b" strokeWidth={1.9} />
                </View>
                <Text style={styles.pillarLabel}>{'Resource\nManagement'}</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 3. Sustainable Solutions */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <Sprout size={25} color="#f59e0b" strokeWidth={1.9} />
                </View>
                <Text style={styles.pillarLabel}>{'Sustainable\nSolutions'}</Text>
              </View>

              <View style={styles.pillarDivider} />

              {/* 4. A Better Tomorrow */}
              <View style={styles.pillarItem}>
                <View style={styles.pillarIconBox}>
                  <BarChart3 size={25} color="#f59e0b" strokeWidth={1.9} />
                </View>
                <Text style={styles.pillarLabel}>{'A Better\nTomorrow'}</Text>
              </View>
            </View>
          </View>

          {/* ================= BOTTOM SECTION ================= */}
          <View style={styles.bottomSection}>
            {/* Loading Bar with Percentage */}
            <View style={styles.progressRow}>
              <View style={[styles.progressBarTrack, { width: barTrackWidth }]}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.percentageText}>{percent}%</Text>
            </View>

            {/* Subtext: LOADING YOUR WORKSPACE... */}
            <Text style={styles.loadingWorkspaceText}>
              LOADING YOUR WORKSPACE...
            </Text>
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
  safeContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  /* Top Section */
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emblemImage: {
    width: 140,
    height: 72,
  },
  brandTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3.8,
    textAlign: 'center',
  },
  brandLegal: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#cbd5e1',
    letterSpacing: 4.8,
    marginTop: 4,
    textAlign: 'center',
  },
  goldDivider: {
    width: 44,
    height: 2,
    backgroundColor: '#d4af37',
    borderRadius: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 17,
    fontStyle: 'italic',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.2,
  },

  /* 4 Pillars */
  pillarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
  },
  pillarIconBox: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 14.5,
  },
  pillarDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  /* Bottom Section */
  bottomSection: {
    alignItems: 'center',
    width: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 5.5,
    backgroundColor: 'rgba(51, 65, 85, 0.72)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 36,
  },
  loadingWorkspaceText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
