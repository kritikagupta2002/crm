import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme';

export const initialsOf = (name = '') =>
  name
    .replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

interface AvatarProps {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/* A person's initials on teal with a gold ring, as on the web CRM; nobody gets someone else's photo. */
export const Avatar: React.FC<AvatarProps> = ({ name, size = 48, style }) => (
  <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, style]}>
    <Text style={[styles.text, { fontSize: Math.round(size * 0.36) }]}>{initialsOf(name)}</Text>
  </View>
);

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  text: {
    color: colors.textInverse,
    fontFamily: fonts.serif,
  },
});
