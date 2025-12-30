import { colors, icons } from '@/constants'
import OrderCart from '@/components/sub/orderCart'
import { OrderType } from '@/types'
import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import LoadingIcon from '@/components/sub/loading/loadingIcon'
import axios from 'axios'
import { backEndUrl } from '@/api'
import { useLoadingScreen } from '@/contexts/loadingScreen'

type props = {
    deliveredOrdersCount: number, 
    setDeliveredOrdersCounts: (value: number) => void
}

const Delivered = ({
    deliveredOrdersCount,
    setDeliveredOrdersCounts
}: props) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [ loadingDeliveredPage, setLoadingDeliveredPage ] = useState<boolean>(false);
    const [limit, setLimit] = useState<number>(10);
    const [deliveredSkip, setDeliveredSkip] = useState<number>(0);
    const [ deliveredOrders, setDeliveredOrders ] = useState<OrderType[]>([]);
    const { setLoadingScreen } = useLoadingScreen();

    const getMoreDeliveredOrder = async () => {

        setLoadingDeliveredPage(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "delivered",
                limit,
                skip: deliveredSkip
            }
        })
        .then(({ data }) => {
            setDeliveredOrders([...deliveredOrders, ...data.orders]);
            setDeliveredOrdersCounts(data.ordersCount)
            setDeliveredSkip(deliveredSkip + limit);
        })
        .catch(( err ) => {
            console.log({err});
        })
        
        setLoadingDeliveredPage(false);
    }

    const handleRefresh = async () => {

        setRefreshing(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "delivered",
                limit: 4,
                skip: 0
            }
        })
        .then(({ data }) => {
            setDeliveredOrders(data.orders);
            setDeliveredOrdersCounts(data.ordersCount)
            setDeliveredSkip(4);
        })
        .catch(( err ) => {
            console.log({err});
        })

        setRefreshing(false);
        
    }
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom && deliveredOrders.length > deliveredOrdersCount) {
            getMoreDeliveredOrder();
        }
    };

    useEffect (() => {
        // setLoadingScreen(true);
        handleRefresh();
        // setLoadingScreen(false);
    }, [])

    useEffect(() => {
        console.log(deliveredOrders.length , deliveredOrdersCount);
        
        if (deliveredOrdersCount != 0 && deliveredOrders.length != deliveredOrdersCount) {
            setLoadingDeliveredPage(true)
        } else {
            setLoadingDeliveredPage(false)
        }
        
    }, [deliveredOrders.length])

  return (
    <View
        style={{
            height: "100%",
            backgroundColor: colors.light[100],
        }}
    >

      <ScrollView
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 100,
          flexDirection: "column",
          // justifyContent: "center",
          gap: 5,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[colors.dark[200]]} // Android
              tintColor={colors.dark[200]} // iOS
              title={'loading...'}
              titleColor={'#000'}
          />
        }
      >
  
        {
          deliveredOrders.length == 0 ?
            <View 
                className='w-full h-full flex justify-center items-center bg-red-500- py-[200px] gap-5 opacity-50'
                style={{
                // paddingBottom: 200
                }}
            >
                <Image
                source={icons.openBoxBlack}
                className='w-32 h-32'
                />
                <Text>there is no failed order !</Text>
            </View>
          :

            deliveredOrders.map((order, index) => (
                <OrderCart 
                    key={index}
                    order={order}
                />
            ))
        }
          
        {loadingDeliveredPage && <View className='w-full h-10 flex justify-center items-center my-5'>
            <LoadingIcon/>
        </View>}

      </ScrollView>

    </View>
  )
}

export default Delivered
