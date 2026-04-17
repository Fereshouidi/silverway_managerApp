import { colors, icons } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useOwner } from '@/contexts/owner';
import { AdminAccess } from '@/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useBanner } from '@/contexts/yesNoBanner';

type SidebarItem = {
  key: string;
  title: string;
  route: string;
  icon: any;
  access?: AdminAccess;
  isLogout?: boolean;
};

// Interface to receive the close function from TabLayout
interface SidebarProps {
  closeDrawer?: () => void;
}

export default function Sidebar({ closeDrawer }: SidebarProps) {
  const { admin, setAdmin } = useAdmin();
  const { showBanner } = useBanner();
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { ownerInfo } = useOwner();

  const items: SidebarItem[] = [
    { key: 'analytics', title: 'Analytics', route: '/(tabs)/analytics', icon: 'pie-chart', access: 'Open Analytics page' },
    { key: 'products', title: 'Products', route: '/(tabs)/products', icon: 'package', access: 'Open Products page' },
    { key: 'collections', title: 'Collections', route: '/(tabs)/products?tab=collections', icon: 'layers', access: 'Manage Collections' },
    { key: 'orders', title: 'Orders', route: '/(tabs)/orders', icon: 'shopping-bag', access: 'Open Orders page' },
    { key: 'people', title: 'People', route: '/(tabs)/people', icon: 'users', access: 'Open People page' },
    { key: 'notifications', title: 'Notifications', route: '/(tabs)/notifications', icon: 'bell', access: 'Open notifications page' },
    { key: 'setting', title: 'Setting', route: '/screens/setting', icon: 'settings', access: 'Open setting page' },
  ];

  const visibleItems = items.filter(
    (item) => !item.access || admin?.accesses?.includes(item.access)
  );

  const handleNavigation = (item: SidebarItem) => {
    // 1. Close the drawer first for a smooth transition
    if (closeDrawer) {
      closeDrawer();
    }

    if (item.isLogout) {
      showBanner({
        message: "Make sure you want to end your current session. You will need to sign in again to access the dashboard.",
        onConfirm: async () => {
          AsyncStorage.removeItem('adminToken');
          setAdmin(null);
          router.replace('/(auth)/signin');
        }
      });
      return;
    }

    // 2. Navigate to the selected route
    router.push(item.route as any);
  };

  const isActive = (route: string) => {
    const [pathPart, queryPart] = route.split('?');
    const base = pathPart.replace('/(tabs)/', '');
    
    // Check if the current pathname matches the base route
    if (pathname?.includes(base)) {
      if (queryPart) {
        // If route has specific query params required (e.g. ?tab=collections)
        const [key, value] = queryPart.split('=');
        return params[key] === value;
      } else {
        // If route has NO query params, make sure the current URL isn't meant for a sub-tab
        if (base === 'products' && params.tab === 'collections') {
          return false;
        }
        return true;
      }
    }
    return false;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.light[100] }}>
      {/* Header: User & Brand Info */}
      <View className="pt-16 px-6 pb-6 border-b border-gray-100">
        <View className="w-full h-fit rounded-xl flex items-center justify-center my-6">
          {ownerInfo?.logo?.light ? (
            <Image
              source={{ uri: ownerInfo.logo.light }}
              className="w-20 h-20 bg-gray-100 rounded-xl"
              resizeMode="contain"
            />
          ) : (
            <View className="w-24 h-24 bg-gray-200 rounded-xl items-center justify-center">
              <MaterialCommunityIcons name="image-off-outline" size={30} color={colors.dark[100]} />
            </View>
          )}
        </View>

        <Text className="text-xl font-black" style={{ color: colors.dark[100] }}>
          Menu
        </Text>
        <Text className="text-sm opacity-50 font-medium" style={{ color: colors.dark[100] }}>
          {admin?.fullName || 'Admin Account'}
        </Text>
      </View>

      {/* Main Content: Navigation Items */}
      <ScrollView
        className="flex-1 px-3 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {visibleItems.map((item) => {
          const active = isActive(item.route);
          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavigation(item)}
              className="flex-row items-center px-4 py-4 mb-2 rounded-xl active:opacity-60"
              style={{
                backgroundColor: active ? colors.dark[100] : 'transparent'
              }}
            >
              <View
                className="w-9 h-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: active ? 'rgba(255,255,255,0.15)' : colors.light[200] }}
              >
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={active ? colors.light[100] : colors.dark[100]}
                />
              </View>
              <Text
                className="ml-4 text-base font-bold"
                style={{ color: active ? colors.light[100] : colors.dark[100] }}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}

      </ScrollView>

      {/* Footer / Logout */}
      <View className="p-3 border-t border-gray-50">
        <Pressable
          onPress={() => handleNavigation({ key: 'logout', title: 'Sign Out', route: '', icon: 'logout', isLogout: true })}
          className="flex-row items-center px-4 py-4 rounded-xl active:opacity-60"
          style={{ backgroundColor: 'transparent' }}
        >
          <View
            className="w-9 h-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#fff5f5' }}
          >
            <Feather
              name="log-out"
              size={18}
              color="#ff4444"
            />
          </View>
          <Text
            className="ml-4 text-base font-bold"
            style={{ color: '#ff4444' }}
          >
            Sign Out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}