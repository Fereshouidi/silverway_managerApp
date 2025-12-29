import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Header from '@/components/main/header';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { colors, icons } from '@/constants';
import { HapticTab } from '@/components/haptic-tab';
import { Image, ImageSourcePropType, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pending from './pending';
import Delivered from './delivered';
import Failed from './failed';
import { OrderType } from '@/types';
import { useSocket } from '@/contexts/socket';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

    const Tab = createMaterialTopTabNavigator();
    const socket = useSocket();

    const [ pendingOrders, setPendingOrders ] = useState<OrderType[]>([]);
    const [ failedOrders, setFailedOrders ] = useState<OrderType[]>([]);
    const [ deliveredOrders, setDeliveredOrders ] = useState<OrderType[]>([]);

    const [ pendingOrdersCount, setPendingOrdersCounts ] = useState<number>(0);
    const [ failedOrdersCount, setFailedOrdersCounts ] = useState<number>(0);
    const [ deliveredOrdersCount, setDeliveredOrdersCounts ] = useState<number>(0);

    const [ loadingFirstRender, setLoadingFirstRender ] = useState<boolean>(true);
    const [ loadingPendingPage, setLoadingPendingPage ] = useState<boolean>(false);
    const [ loadingFailedPage, setLoadingFailedPage ] = useState<boolean>(false);
    const [ loadingDeliveredPage, setLoadingDeliveredPage ] = useState<boolean>(false);


    useEffect(() => {
        if (!socket) return;

        socket.emit("get_inational_order_batches", 10);

        socket.on("receive_order", (data: any) => {

            setPendingOrders(data.orders.pendingOrders);
            setFailedOrders(data.orders.failedOrders);
            setDeliveredOrders(data.orders.deliveredOrders);

            setPendingOrdersCounts(data.pendingOrdersCount?? 0);
            setFailedOrdersCounts(data.failedOrdersCount?? 0);
            setDeliveredOrdersCounts(data.deliveredOrdersCount?? 0);

            setLoadingFirstRender(false);
        })

        return () => {
            socket.off("receive_order");
        };
    }, [socket])

    useEffect(() => {
        console.log({pendingOrdersCount});
        
    }, [pendingOrdersCount])

  const TabIcon = ({source, focused}: {source: ImageSourcePropType, focused: boolean}) => (
      <View className={`w-10 h-10 flex flex-row items-center justify-center rounded-full p-0`}>
          <View className={`rounded-full w-10 h-10 items-center justify-center ${focused ? colors.dark[400] : colors.light[400]}`}>
              <Image 
                  source={source}
                  tintColor={focused ? colors.light[200] : colors.light[700]}
                  className={`w-6 h-6`}
                  resizeMode="contain"
              />
          </View>
      </View>
  )

  return (
    <View className='w-full h-full'>
        <View   
            className='w-full h-[45px] absolute- top-0'
            style={{
                backgroundColor: colors.light[100]
                
            }}
        ></View>
        <Header
            className='w-full bg-red-500-'
            title='orders'
        />
        <Tab.Navigator
            initialRouteName="Pending"
            screenOptions={{
                tabBarActiveTintColor: colors.dark[100],
                tabBarIndicatorStyle: { backgroundColor: colors.dark[100], height: 3 },
                tabBarStyle: { backgroundColor: colors.light[100] },
            }}
        >
            <Tab.Screen 
                name="Pending"
                options={{ title: `Pending (${pendingOrdersCount})` }}
            >
                {() => <Pending orders={pendingOrders} />}
            </Tab.Screen>

            <Tab.Screen 
                name="Failed"
                options={{ title: `Failed (${failedOrdersCount})` }}
            >                
                {() => <Failed orders={failedOrders} />}
            </Tab.Screen>

            <Tab.Screen 
                name="Delivered"
                options={{ title: `Delivered (${deliveredOrdersCount})` }}
            >                
                {() => <Delivered orders={deliveredOrders} />}
            </Tab.Screen>

        </Tab.Navigator>
    </View>

  );
}

