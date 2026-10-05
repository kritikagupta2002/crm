import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Easing,
  StatusBar,
} from 'react-native';
import { Compass, ShieldCheck, Layers } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { width } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [loadingText, setLoadingText] = useState('Initializing Geospatial Core...');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
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

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => {
      setLoadingText('Loading Role-Based Workspaces...');
    }, 700);

    const t2 = setTimeout(() => {
      setLoadingText('Verifying Enterprise Security...');
    }, 1400);

    const t3 = setTimeout(() => {
      setLoadingText('Ready');
    }, 1900);

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 280,
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
    outputRange: [0, Math.min(width * 0.6, 240)],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

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
        <Animated.View style={[styles.emblemWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.emblemOuter}>
            <View style={styles.emblemInner}>
              <Compass size={40} color={colors.primaryDark} strokeWidth={2.2} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.title}>BANSAL GEO</Text>
        <Text style={styles.subtitle}>MINING & GEOLOGICAL EXPLORATION</Text>

        <View style={styles.taglineBadge}>
          <Layers size={12} color={colors.primaryDark} style={{ marginRight: 5 }} />
          <Text style={styles.taglineText}>CRM • ERM • HRMS • FINANCE</Text>
        </View>

        <View style={styles.enterprisePill}>
          <ShieldCheck size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.enterpriseText}>Enterprise Field Platform • v1.0</Text>
        </View>
      </Animated.View>

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
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(13, 148, 136, 0.05)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(2, 132, 199, 0.04)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emblemWrapper: {
    marginBottom: spacing.lg,
  },
  emblemOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 3,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.2)',
    marginBottom: spacing.xs + 2,
  },
  taglineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  enterprisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  enterpriseText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  progressBarTrack: {
    width: 220,
    height: 3,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryDark,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 9.5,
    color: colors.textTertiary,
    fontWeight: '400',
  },
});
