import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../global.css";

import { colors } from '@/constants';
import { ProductSectionProvider } from '@/contexts/productTab';
import React, { useEffect } from 'react';
// import { SocketProvider } from '@/contexts/socket';
import { AdminProvider } from '@/contexts/admin';
import { LoadingScreenProvider } from '@/contexts/loadingScreen';
import { OwnerProvider } from '@/contexts/owner';
import { StatusBannerProvider } from '@/contexts/StatusBanner';
import { BannerProvider } from '@/contexts/yesNoBanner';
import { createNotificationChannel } from '@/service/notification';
import RootLayoutContent from './rootLayoutContent';
import { SidebarProvider } from '@/contexts/sidebar';
import Sidebar from '@/components/main/sidebar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export const unstable_settings = {
  anchor: '(tabs)',
};


export default function RootLayout() {

  useEffect(() => {
    const handleNotifications = async () => {
      try {
        await createNotificationChannel();
      } catch (e) {
        console.error("Failed to create notification channel:", e);
      }
    }
    handleNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBannerProvider>
        <LoadingScreenProvider>
          <ProductSectionProvider>
            <OwnerProvider>
              <AdminProvider>
                <BannerProvider>
                  <SidebarProvider>
                    <RootLayoutContent />
                    <StatusBar style="dark" backgroundColor={colors.light[100]} />
                  </SidebarProvider>
                </BannerProvider>
              </AdminProvider>
            </OwnerProvider>
          </ProductSectionProvider>
        </LoadingScreenProvider>
      </StatusBannerProvider>
    </SafeAreaProvider>
  );
}