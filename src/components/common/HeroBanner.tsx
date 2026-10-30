import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ImageSourcePropType } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fonts, radius } from '../../theme';

const MINE = require('../../../assets/hero-banner.jpg');

interface HeroBannerProps {
  title: string;
  /** A short line under the title, e.g. today's date. */
  caption?: string;
  image?: ImageSourcePropType;
  children?: React.ReactNode;
}

/* The site photo with an ink fade from the foot, so the photo stays visible and the words stay readable. */
export const HeroBanner: React.FC<HeroBannerProps> = ({ title, caption, image = MINE, children }) => (
  <ImageBackground source={image} style={styles.banner} imageStyle={styles.image} resizeMode="cover">
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.textPrimary} stopOpacity="0.05" />
          <Stop offset="0.45" stopColor={colors.textPrimary} stopOpacity="0.25" />
          <Stop offset="1" stopColor={colors.textPrimary} stopOpacity="0.85" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#fade)" />
    </Svg>
    <View style={styles.body}>
      <View style={styles.rule} />
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {children}
    </View>
  </ImageBackground>
);

const styles = StyleSheet.create({
  banner: {
    minHeight: 168,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  // Without a size the photo keeps its own pixels and only its top corner shows.
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
  },
  body: {
    padding: 16,
  },
  rule: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textInverse,
  },
  caption: {
    marginTop: 4,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
  },
});
