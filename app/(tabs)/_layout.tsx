import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { colors, icons } from '@/constants'
import { Image, ImageSourcePropType, View } from 'react-native';
import { useAdmin } from '@/contexts/admin';
import { AdminAccess } from '@/types';
import LoadingIcon from '@/components/sub/loading/loadingIcon';

export default function TabLayout() {
  const { admin } = useAdmin();

  // 1. تعريف القائمة الكاملة للشاشات
  const allPossibleRoutes = [
    { key: "Open Analytics page", name: "analytics", title: 'Analytics', icon: icons.analytics },
    { key: "Open Products page", name: "products", title: 'Products', icon: icons.cubes },
    { key: "Open Orders page", name: "orders", title: 'Orders', icon: icons.checklist },
    { key: "Open People page", name: "people", title: 'People', icon: icons.userWhite },
    // { key: "Open notifications page", name: "notifications", title: 'Notifications', icon: icons.settings },
    { key: "Open setting page", name: "setting", title: 'Setting', icon: icons.settings },
  ];

  // 2. حساب الصلاحيات
  const allowedRoutes = useMemo(() => {
    if (!admin || !admin.accesses) return [];
    return allPossibleRoutes.filter(route => 
      admin.accesses.includes(route.key as AdminAccess)
    );
  }, [admin]);

  // 3. شاشة التحميل: تظهر فقط إذا لم يكن الأدمن موجوداً بعد
  if (!admin) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <View className="w-12 h-12">
           <LoadingIcon />
        </View>
      </View>
    );
  }

  // تحديد الصفحة الافتراضية: إذا لم توجد أي صفحة مسموحة، نختار Analytics كخيار "وهمي" لمنع الانهيار
  const initialRouteName = allowedRoutes.length > 0 ? allowedRoutes[0].name : "analytics";

  const TabIcon = ({ source, focused }: { source: ImageSourcePropType, focused: boolean }) => (
    <View className="w-12 h-12 flex flex-row items-center justify-center rounded-full p-5">
      <View className={`rounded-full w-12 h-12 items-center justify-center ${focused ? colors.dark[400] : colors.light[400]}`}>
        <Image
          source={source}
          tintColor={focused ? colors.light[200] : colors.light[700]}
          resizeMode="contain"
          className='mb-2'
          style={{ width: 22, height: 22 }}
        />
      </View>
    </View>
  )

  return (
    <Tabs
      initialRouteName={initialRouteName as any}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.light[100],
        tabBarInactiveTintColor: colors.light[700],
        tabBarStyle: {
          backgroundColor: colors.dark[100],
          borderTopWidth: 0,
          borderRadius: 50,
          position: 'absolute',
          marginHorizontal: 20,
          marginBottom: 20,
          height: 78,
          overflow: 'hidden',
          display: 'flex',
        },
        tabBarItemStyle: {
          paddingTop: 14,
          height: "100%",
        },
      }}
    >
      {allPossibleRoutes.map((route) => {
        // هل يملك الصلاحية؟
        const hasAccess = admin.accesses?.includes(route.key as AdminAccess);
        
        // المنطق الحاسم:
        // نظهر الشاشة إذا كان لديه صلاحية OR إذا كانت هذه هي الشاشة "الوهمية" لمنع الكراش
        // (حتى لو ظهرت لثانية، الـ RootLayout سيقوم بتوجيهه للخارج فوراً إذا لم يكن مصرحاً له)
        const shouldShow = hasAccess || (allowedRoutes.length === 0 && route.name === "analytics");

        return (
          <Tabs.Screen
            key={route.name}
            name={route.name}
            options={{
              title: route.title,
              href: shouldShow ? undefined : null,
              tabBarIcon: ({ focused }) => (
                <TabIcon focused={focused} source={route.icon} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}