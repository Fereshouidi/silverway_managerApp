import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ProductSectionProvider } from '@/contexts/productTab';
import { colors } from '@/constants';
import { SocketProvider } from '@/contexts/socket';
import { LoadingScreenProvider, useLoadingScreen } from '@/contexts/loadingScreen';
import LoadingScreen from '@/components/sub/loading/loadingScreen';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  
  const colorScheme = useColorScheme();

  return (
    <SocketProvider>
      <LoadingScreenProvider>
        <ProductSectionProvider>
            
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="addProduct" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>

            <StatusBar style="dark" backgroundColor={colors.light[100]} />
            <LoadingScreen />

            
        </ProductSectionProvider>
      </LoadingScreenProvider>
    </SocketProvider>

  );
}
