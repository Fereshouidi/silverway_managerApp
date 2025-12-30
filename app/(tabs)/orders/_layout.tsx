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
import { useLoadingScreen } from '@/contexts/loadingScreen';
import axios from 'axios';
import { backEndUrl } from '@/api';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

    const Tab = createMaterialTopTabNavigator();
    const socket = useSocket();
    const { setLoadingScreen } = useLoadingScreen();


    const [ pendingOrders, setPendingOrders ] = useState<OrderType[]>([]);
    const [ failedOrders, setFailedOrders ] = useState<OrderType[]>([]);
    const [ deliveredOrders, setDeliveredOrders ] = useState<OrderType[]>([]);

    const [ pendingOrdersCount, setPendingOrdersCounts ] = useState<number>(0);
    const [ failedOrdersCount, setFailedOrdersCounts ] = useState<number>(0);
    const [ deliveredOrdersCount, setDeliveredOrdersCounts ] = useState<number>(0);

    const [ loadingFirstRender, setLoadingFirstRender ] = useState<boolean>(true);

    // const [ loadingPendingPage, setLoadingPendingPage ] = useState<boolean>(false);
    const [ loadingFailedPage, setLoadingFailedPage ] = useState<boolean>(false);
    const [ loadingDeliveredPage, setLoadingDeliveredPage ] = useState<boolean>(false);

    const [limit, setLimit] = useState<number>(1);

    // const [pendingSkip, setPendingSkip] = useState<number>(limit);
    const [failedSkip, setFailedSkip] = useState<number>(limit);
    const [deliveredSkip, setDeliveredSkip] = useState<number>(limit);


    useEffect(() => {

        get_inational_order_batches();

    }, [])

    // const get_inational_order_batches = async () => {
    //     if (!socket) return;

    //     socket.emit("get_inational_order_batches", 10);

    //     socket.on("receive_order", (data: any) => {

    //         setPendingOrders(data.orders.pendingOrders);
    //         setFailedOrders(data.orders.failedOrders);
    //         setDeliveredOrders(data.orders.deliveredOrders);

    //         setPendingOrdersCounts(data.pendingOrdersCount?? 0);
    //         setFailedOrdersCounts(data.failedOrdersCount?? 0);
    //         setDeliveredOrdersCounts(data.deliveredOrdersCount?? 0);

    //         setLoadingFirstRender(false);
    //     })

    //     return () => {
    //         socket.off("receive_order");
    //     };
    // }

    // const getMorePendingOrder = async () => {

    //     // setLoadingScreen(true);

    //     await axios.get( backEndUrl + "/getOrdersByStatus", {
    //         params: {
    //             status: "pending",
    //             limit,
    //             skip: pendingSkip
    //         }
    //     })
    //     .then(({ data }) => {
    //         setPendingOrders([...pendingOrders, ...data.orders]);
    //         setPendingSkip(pendingSkip + limit);
    //     })
    //     .catch(( err ) => {
    //         console.log({err});
    //     })
    //     // setLoadingScreen(false);
    // }

    const get_inational_order_batches = async () => {
        await axios.get( backEndUrl + "/getOrderStatusCounts" )
        .then(({ data }) => {
            setPendingOrdersCounts(data.pendingOrdersCount);
            setFailedOrdersCounts(data.failedOrdersCount);
            setDeliveredOrdersCounts(data.deliveredOrdersCount)
        })
    }

    const getMoreFailedOrder = async () => {

        setLoadingScreen(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "failed",
                limit,
                skip: failedSkip
            }
        })
        .then(({ data }) => {
            setFailedOrders(data.orders);
            setFailedSkip(failedSkip + limit);
        })
        .catch(( err ) => {
            console.log({err});
        })

        setLoadingScreen(false);
    }

    const getMoreDeliveredOrder = async () => {

        setLoadingScreen(true);

        await axios.get( backEndUrl + "/getOrdersByClientAndStatus", {
            params: {
                status: "delivered",
                limit,
                skip: deliveredSkip
            }
        })
        .then(({ data }) => {
            setDeliveredOrders(data.orders);
            setDeliveredSkip(deliveredSkip + limit);
        })
        .catch(( err ) => {
            console.log({err});
        })

        setLoadingScreen(false);
    }


    // const getLessPendingOrders = async () => {

    //     if (pendingSkip <= limit) return;

    //     const newSkip = pendingSkip - limit;

    //     setLoadingScreen(true);
    //     try {
    //         const { data } = await axios.get(backEndUrl + "/getOrdersByClientAndStatus", {
    //             params: {
    //                 clientId: client?._id,
    //                 status: "pending",
    //                 limit,
    //                 skip: newSkip - limit
    //             }
    //         });

    //         setOrders({
    //             ...orders,
    //             pendingOrders: data.orders
    //         });
    //         setPendingSkip(newSkip);
    //     } catch (err) {
    //         console.log({ err });
    //     } finally {
    //         setLoadingScreen(false);
    //     }
    // };

    // const getLessFailedOrders = async () => {

    //     if (failedSkip <= limit) return;

    //     const newSkip = failedSkip - limit;

    //     setLoadingScreen(true);
    //     try {
    //         const { data } = await axios.get(backEndUrl + "/getOrdersByClientAndStatus", {
    //             params: {
    //                 clientId: client?._id,
    //                 status: "failed",
    //                 limit,
    //                 skip: newSkip - limit
    //             }
    //         });

    //         setOrders({
    //             ...orders,
    //             failedOrders: data.orders
    //         });
    //         setFailedSkip(newSkip);
    //     } catch (err) {
    //         console.log({ err });
    //     } finally {
    //         setLoadingScreen(false);
    //     }
    // };

    // const getLessDeliveredOrders = async () => {

    //     if (deliveredSkip <= limit) return;

    //     const newSkip = deliveredSkip - limit;

    //     setLoadingScreen(true);
    //     try {
    //         const { data } = await axios.get(backEndUrl + "/getOrdersByClientAndStatus", {
    //             params: {
    //                 clientId: client?._id,
    //                 status: "delivered",
    //                 limit,
    //                 skip: newSkip - limit
    //             }
    //         });

    //         setOrders({
    //             ...orders,
    //             deliveredOrders: data.orders
    //         });
    //         setDeliveredSkip(newSkip);
    //     } catch (err) {
    //         console.log({ err });
    //     } finally {
    //         setLoadingScreen(false);
    //     }
    // };

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
                {() => <Pending 
                    pendingOrdersCount={pendingOrdersCount}
                    setPendingOrdersCounts={setPendingOrdersCounts}
                />}
            </Tab.Screen>

            <Tab.Screen 
                name="Failed"
                options={{ title: `Failed (${failedOrdersCount})` }}
            >                
                {() => <Failed
                    failedOrdersCount={failedOrdersCount}
                    setFailedOrdersCounts={setFailedOrdersCounts}
                />}
            </Tab.Screen>

            <Tab.Screen 
                name="Delivered"
                options={{ title: `Delivered (${deliveredOrdersCount})` }}
            >                
                {() => <Delivered 
                    deliveredOrdersCount={deliveredOrdersCount}
                    setDeliveredOrdersCounts={setDeliveredOrdersCounts}
                />}
            </Tab.Screen>

        </Tab.Navigator>
    </View>

  );
}

