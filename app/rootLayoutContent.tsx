import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../global.css";

import { backEndUrl } from '@/api';
import StatusBanner from '@/components/sub/banners/statusBanner';
import YesNoBanner from '@/components/sub/banners/yesNoBanner';
import LoadingIcon from '@/components/sub/loading/loadingIcon';
import LoadingScreen from '@/components/sub/loading/loadingScreen';
import OfflineScreen from '@/components/sub/offline/OfflineScreen';
import { useAdmin } from '@/contexts/admin';
import { useOwner } from '@/contexts/owner';
import { registerForPushNotificationsAsync } from '@/lib';
import { AdminAccess } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Network from 'expo-network';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Image, View, Text } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';

function RootLayoutContent() {
  const { admin, setAdmin } = useAdmin();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { setOwnerInfo } = useOwner();
  const isRegistered = useRef(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [open, setOpen] = React.useState(false);

  // 1. جلب البيانات الأساسية عند تشغيل التطبيق (المالك + الأدمن)
  const initializeData = async () => {
    setIsReady(false);
    setIsOffline(false);
    try {
      // جلب بيانات المالك
      const ownerRes = await axios.get(`${backEndUrl}/getOwnerInfo`);
      setOwnerInfo(ownerRes.data.ownerInfo);

      // جلب بيانات الأدمن باستخدام التوكن المخزن
      const adminToken = await AsyncStorage.getItem("adminToken");
      if (adminToken) {
        const adminRes = await axios.get(`${backEndUrl}/getAdminByToken`, {
          params: { token: adminToken }
        });
        if (adminRes.data.admin) {
          setAdmin(adminRes.data.admin);
        }
      }
    } catch (err) {
      console.error("Initialization Error:", err);
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        setIsOffline(true);
      }
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    initializeData();

    const logout = async () => {
      await AsyncStorage.removeItem("adminToken");
      setAdmin(null);
      router.replace('/(auth)/signin');
    }
    // logout();

  }, [])

  // 2. منطق التوجيه الديناميكي وتسجيل الإشعارات
  useEffect(() => {
    if (!isReady) return;

    const handleNavigationAndPush = async () => {
      // تسجيل الجهاز للإشعارات عند وجود أدمن
      if (admin && !isRegistered.current) {
        isRegistered.current = true;
        try {
          await registerForPushNotificationsAsync(admin);
        } catch (error) {
          console.error("Push Registration Error:", error);
        }
      }

      // التحقق من حالة الدخول والتوجيه
      if (admin) {
        if (admin.isVerified) {
          // ننتحقق إذا كان المستخدم حالياً في صفحات الـ Auth (Login/Register)
          const inAuthGroup = segments[0] === '(auth)' || segments[0] === undefined;
          const isWelcomePage = segments[segments.length - 1] === 'welcome';

          if (inAuthGroup && !isWelcomePage && isFirstRender) {
            // تعريف مصفوفة الأولوية للمسارات المتاحة
            const priorityRoutes = [
              { key: "Open Analytics page", path: "/(tabs)/analytics" },
              { key: "Open Orders page", path: "/(tabs)/orders" },
              { key: "Open Products page", path: "/(tabs)/products" },
              { key: "Open People page", path: "/(tabs)/people" },
              { key: "Open setting page", path: "/(tabs)/setting" },
            ];

            // العثور على أول مسار يمتلك الأدمن صلاحية الوصول إليه
            const firstAvailable = priorityRoutes.find(route =>
              admin?.accesses?.includes(route.key as AdminAccess)
            );

            // التوجيه للمسار المناسب
            if (firstAvailable) {
              router.replace(firstAvailable.path as any);
            } else {
              // إذا لم يملك أي صلاحية "Open"، نكتفي بصفحة التحليلات كخيار نهائي
              router.replace('/(tabs)/analytics');
            }
          }
        } else {
          // إذا كان الحساب يحتاج تفعيل (Unverified)
          router.replace({
            pathname: '/screens/handleAccount/[id]',
            params: { id: admin?._id }
          });
        }
      } else {
        // إذا لم يكن هناك أدمن مسجل دخول
        const inAuthGroup = segments[0] === '(auth)';
        if (!inAuthGroup) {
          router.replace('/(auth)/signin');
        }
      }
    };

    handleNavigationAndPush();
    setIsFirstRender(false);
  }, [admin, isReady, segments]);

  useEffect(() => {
    // This listener is fired whenever a user taps on or interacts with a notification 
    // (works when app is foregrounded, backgrounded, or killed)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      // Navigate to the orders tab
      router.push('/(tabs)/orders' as any);
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then(token => {
  //     if (token) {
  //       // هنا يمكنك إرسال الـ Token إلى الـ Backend الخاص بك وتخزينه
  //       console.log("Token generated successfully:", token);
  //     }
  //   });
  // }, []);

  // شاشة التحميل الأولية (Splash Screen البديلة)
  if (!isReady) {
    return (
      <View className='w-full h-full flex justify-center items-center bg-black'>
        <Image
          source={require("@/app/assets/images/logo-black.jpg")}
          className='w-[200px] h-[200px]'
        />
        <View className='w-10 h-10'>
          <LoadingIcon />
        </View>
      </View>
    );
  }

  if (isOffline) {
    return <OfflineScreen onRetry={initializeData} />;
  }

  // useEffect(() => {
  //   // logout 
  //   const logout = async () => {
  //     await AsyncStorage.removeItem("adminToken");
  //     setAdmin(null);
  //     router.replace('/(auth)/signin');
  //   }
  //   logout();

  // }, [])

  return (
    <>
      <StatusBar style="dark" />


      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="addProduct" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <LoadingScreen />
      <YesNoBanner />
      <StatusBanner />
    </>
  );
}

export default RootLayoutContent;