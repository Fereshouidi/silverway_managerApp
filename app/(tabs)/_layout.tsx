import { Tabs } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import { colors } from '@/constants'
import { Image, ImageSourcePropType, View, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdmin } from '@/contexts/admin';
import { AdminAccess } from '@/types';
import LoadingIcon from '@/components/sub/loading/loadingIcon';
import { Drawer } from 'react-native-drawer-layout';
import Sidebar from '@/components/main/sidebar';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { admin } = useAdmin();
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!admin) return;
    const fetchUnreadCount = async () => {
      try {
        const { data } = await axios.get(`${backEndUrl}/getUnreadNotificationCount`);
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.log("Error fetching unread notifications count:", error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [admin]);

  // 1. Definition of all possible routes
  const allPossibleRoutes = [
    { key: "Open Analytics page", name: "analytics", title: 'Analytics', iconName: 'pie-chart', iconType: 'Feather' },
    { key: "Open Products page", name: "products", title: 'Products', iconName: 'package', iconType: 'Feather' },
    { key: "Open Orders page", name: "orders", title: 'Orders', iconName: 'shopping-bag', iconType: 'Feather' },
    { key: "Open notifications page", name: "notifications", title: 'Notifications', iconName: 'bell', iconType: 'Feather' },
    { key: "Open People page", name: "people", title: 'People', iconName: 'users', iconType: 'Feather' },
  ];

  // 2. Permission calculation
  const allowedRoutes = useMemo(() => {
    if (!admin || !admin.accesses) return [];
    return allPossibleRoutes.filter(route =>
      admin.accesses.includes(route.key as AdminAccess)
    );
  }, [admin]);

  // 3. Loading state
  if (!admin) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <View className="w-12 h-12">
          <LoadingIcon />
        </View>
      </View>
    );
  }

  const initialRouteName = allowedRoutes.length > 0 ? allowedRoutes[0].name : "analytics";

  // Updated TabIcon with better spacing for small labels
  const TabIcon = ({ iconName, iconType, focused, badge }: { iconName: string, iconType: 'Feather' | 'MCI', focused: boolean, badge?: number }) => (
    <View className=" w-20 h-full bg-red-500- flex items-center justify-center mt-1">
      <View
        className={`rounded-full w-full bg-blue-500- h-full bg-blue-500- mb-5- items-center justify-center relative ${focused ? 'bg-white/10-' : 'transparent'}`}
        style={{ height: 70 }}
      >
        {iconType === 'Feather' ? (
          <Feather
            name={iconName as any}
            size={23}
            color={focused ? colors.light[100] : colors.light[700]}
            style={{ marginBottom: 10 }}
          />
        ) : (
          <MaterialCommunityIcons
            name={iconName as any}
            size={23}
            color={focused ? colors.light[100] : colors.light[700]}
            style={{ marginBottom: 4 }}
          />
        )}
        {badge !== undefined && badge > 0 && (
          <View className="absolute top-2 right-5 bg-red-500 rounded-full w-4 h-4 items-center justify-center shadow-sm">
            <Text className="text-white text-[9px] font-black">{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={() => <Sidebar closeDrawer={() => setOpen(false)} />}
      swipeEnabled={true}
      swipeEdgeWidth={120}
      drawerType="front"
      drawerStyle={{
        width: "80%",
        backgroundColor: colors.light[100],
      }}
      overlayStyle={{
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}
    >
      <Tabs
        initialRouteName={initialRouteName as any}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.light[100],
          tabBarInactiveTintColor: colors.light[700],

          // Small text styling
          tabBarLabelStyle: {
            fontSize: 9,              // Smaller font size
            fontWeight: '600',        // Semi-bold for legibility
            marginBottom: 0,         // Spacing from bottom
          },

          tabBarStyle: {
            backgroundColor: colors.dark[100],
            borderColor: colors.light[100],
            borderWidth: 0.2,
            borderTopWidth: 0.2,
            borderRadius: 50,
            position: 'absolute',
            marginHorizontal: 20,
            marginBottom: 20 + (insets.bottom > 0 ? insets.bottom - 10 : insets.bottom), // Adjust for the floating style
            height: 75,               // Adjusted height for small icons/text
            overflow: 'hidden',
            display: 'flex',
            justifyContent: "center",
            alignItems: "center"
          },

          tabBarItemStyle: {
            paddingTop: 15,            // Centering the icon and label
            height: "100%",
          },
        }}
      >
        {allPossibleRoutes.map((route) => {
          const hasAccess = admin.accesses?.includes(route.key as AdminAccess);
          const shouldShow = hasAccess || (allowedRoutes.length === 0 && route.name === "analytics");

          return (
            <Tabs.Screen
              key={route.name}
              name={route.name}
              options={{
                title: route.title,
                href: shouldShow ? undefined : null,
                tabBarIcon: ({ focused }) => (
                  <TabIcon
                    focused={focused}
                    iconName={route.iconName as any}
                    iconType={route.iconType as any}
                    badge={route.name === 'notifications' ? unreadCount : 0}
                  />
                ),
              }}
            />
          );
        })}

        {/* Force hide the setting tab */}
        <Tabs.Screen
          name="setting"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </Drawer>
  );
}