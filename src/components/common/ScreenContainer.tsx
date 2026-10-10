import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactNode;
  edges?: readonly Edge[];
  noPadding?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  refreshing = false,
  onRefresh,
  header,
  edges,
  noPadding = false,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isSmall = screenWidth < 360;
  const isCompact = screenWidth <= 375;
  const isTablet = screenWidth >= 640;
  const responsivePadding = isSmall ? 10 : isCompact ? 12 : spacing.lg;
  const resolvedEdges: readonly Edge[] = edges ?? (header ? ['bottom'] : ['top', 'bottom']);

  return (
    <View style={[styles.root, style]}>
      {header ? <View style={styles.headerContainer}>{header}</View> : null}
      <SafeAreaView style={styles.safeArea} edges={resolvedEdges}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                noPadding
                  ? { paddingHorizontal: 0, paddingTop: 0 }
                  : { paddingHorizontal: responsivePadding },
                isTablet && styles.tabletContent,
                contentContainerStyle,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                ) : undefined
              }
            >
              {children}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.staticContent,
                noPadding
                  ? { paddingHorizontal: 0, paddingTop: 0 }
                  : { paddingHorizontal: responsivePadding },
                isTablet && styles.tabletContent,
                contentContainerStyle,
              ]}
            >
              {children}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge + 32,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabletContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
});
