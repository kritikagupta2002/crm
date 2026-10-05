import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import {
  AuthProvider,
  CrmProvider,
  FinanceProvider,
  HrmsProvider,
  NotificationProvider,
} from './src/context';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

export default function App() {
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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthProvider>
        <NotificationProvider>
          <CrmProvider>
            <HrmsProvider>
              <FinanceProvider>
                <NavigationContainer theme={navigationTheme}>
                  <RootNavigator />
                </NavigationContainer>
              </FinanceProvider>
            </HrmsProvider>
          </CrmProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
