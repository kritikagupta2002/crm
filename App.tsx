import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { useFonts, Fraunces_400Regular, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  AuthProvider,
  CrmProvider,
  FieldDatabaseProvider,
  InventoryProvider,
  FinanceProvider,
  HrmsProvider,
  NotificationProvider,
} from './src/context';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

// TEMP-PREVIEW: lets the web preview open any screen; remove before shipping.
const navRef = createNavigationContainerRef<any>();
if (__DEV__) (globalThis as any).__nav = navRef;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Fraunces_400Regular, Fraunces_600SemiBold, Fraunces_700Bold });
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background.primary,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border.default,
      notification: colors.danger,
    },
  };

  // Titles use Fraunces; wait for it so they don't jump from the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <NotificationProvider>
          <CrmProvider>
            <HrmsProvider>
              <FinanceProvider>
                <FieldDatabaseProvider>
                <InventoryProvider>
                <NavigationContainer ref={navRef} theme={navigationTheme}>
                  <RootNavigator />
                </NavigationContainer>
                </InventoryProvider>
                </FieldDatabaseProvider>
              </FinanceProvider>
            </HrmsProvider>
          </CrmProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
// Bansal Geo Client Portal v2.6.2 build trigger

