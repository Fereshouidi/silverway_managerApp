import { Tabs } from 'expo-router';
import React from 'react';

import { colors, icons } from '@/constants'
import { HapticTab } from '@/components/haptic-tab';
import { Image, ImageSourcePropType, View } from 'react-native';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

  const TabIcon = ({source, focused}: {source: ImageSourcePropType, focused: boolean}) => (
      <View className={`w-12 h-12 flex flex-row items-center justify-center rounded-full p-5`}>
          <View className={`rounded-full w-12 h-12 items-center justify-center ${focused ? colors.dark[400] : colors.light[400]}`}>
              <Image 
                  source={source}
                  tintColor={focused ? colors.light[200] : colors.light[700]}
                  resizeMode="contain"
                  className='mb-2'
                  style={{
                    width: 22,
                    height: 22,
                  }}
              />
          </View>
      </View>
  )

  return (
    <Tabs
      initialRouteName='analytics'
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        // tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.light[100],
        tabBarInactiveTintColor: colors.light[700],
        // tabBarActiveBackgroundColor: colors.light[500],
        // tabBarShowLabel: false,
        tabBarStyle: {
            backgroundColor: colors.dark[100],
            borderTopWidth: 0,
            // color: "red",
            borderRadius: 50,
            paddingVertical: 0,
            paddingBottom: 0,
            // paddingTop: 10,
            overflow: 'hidden',
            position: 'absolute',
            marginHorizontal: 20,
            marginBottom: 20,
            height: 78,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: "center",
            flexDirection: 'row',
        },
        tabBarItemStyle: {
            display: 'flex',
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            paddingTop: 14,
            // gap: 10,            
            // backgroundColor: 'red',
            height: "100%",
            // borderRadius: "50%"
            // margin: 2,
        },
      }}
      
      >
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'analytics',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={icons.analytics} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={icons.cubes} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={icons.checklist} />,
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Management',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={icons.realEstateAgent} />,
        }}
      />

    </Tabs>
  );
}
