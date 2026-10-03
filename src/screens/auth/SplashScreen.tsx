import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
} from 'react-native';
import { Compass, ShieldCheck, Layers } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [loadingText, setLoadingText] = useState('Initializing Geospatial Core...');

  useEffect(() => {
    // 1. Entrance animation (fade and scale up)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse animation on the logo ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Progress bar animation (0% to 100% over 2000ms)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 4. Staggered loading status text
    const t1 = setTimeout(() => {
      setLoadingText('Loading Role-Based Workspaces...');
    }, 700);

    const t2 = setTimeout(() => {
      setLoadingText('Verifying Enterprise Security...');
    }, 1400);

    const t3 = setTimeout(() => {
      setLoadingText('Ready');
    }, 1900);

    // 5. Completion callback after 2200ms
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(timer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.65],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1d" />

      {/* Ambient background glow decoration */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Brand Emblem */}
        <Animated.View style={[styles.emblemWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.emblemOuter}>
            <View style={styles.emblemInner}>
              <Compass size={44} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        {/* Brand Titles */}
        <Text style={styles.title}>BANSAL GEO</Text>
        <Text style={styles.subtitle}>MINING & GEOLOGICAL EXPLORATION</Text>

        <View style={styles.taglineBadge}>
          <Layers size={13} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.taglineText}>CRM • ERM • HRMS • FINANCE</Text>
        </View>

        {/* Enterprise Platform Badge */}
        <View style={styles.enterprisePill}>
          <ShieldCheck size={12} color={colors.text.secondary} style={{ marginRight: 4 }} />
          <Text style={styles.enterpriseText}>Enterprise Field Platform • v1.0</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress Indicator */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.statusText}>{loadingText}</Text>
        <Text style={styles.copyright}>© 2026 Bansal Geosurveys Pvt. Ltd.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emblemWrapper: {
    marginBottom: spacing.xl,
  },
  emblemOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  emblemInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#111e33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: spacing.sm,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  enterprisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  enterpriseText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    width: '100%',
  },
  progressBarTrack: {
    width: width * 0.65,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
});
