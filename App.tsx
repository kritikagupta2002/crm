import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  AuthProvider,
  CrmProvider,
  HrmsProvider,
  NotificationProvider,
} from './src/context';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NotificationProvider>
          <CrmProvider>
            <HrmsProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </HrmsProvider>
          </CrmProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
