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
    failedOrdersCount: number, 
    setFailedOrdersCounts: (value: number) => void
}

const Failed = ({
    failedOrdersCount,
    setFailedOrdersCounts
}: props) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [ loadingFailedPage, setLoadingFailedPage ] = useState<boolean>(false);
    const [limit, setLimit] = useState<number>(10);
    const [failedSkip, setFailedSkip] = useState<number>(0);
    const [ failedOrders, setFailedOrders ] = useState<OrderType[]>([]);
    const { setLoadingScreen } = useLoadingScreen();

    const getMoreFailedOrder = async () => {

        if (failedOrders.length !< failedOrdersCount) return;

        setLoadingFailedPage(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "failed",
                limit,
                skip: failedOrders
            }
        })
        .then(({ data }) => {
            setFailedOrders([...failedOrders, ...data.orders]);
            setFailedOrdersCounts(data.ordersCount)
            setFailedSkip(failedSkip + limit);
        })
        .catch(( err ) => {
            console.log({err});
        })
        
        setLoadingFailedPage(false);
    }

    const handleRefresh = async () => {

        setRefreshing(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "failed",
                limit: 4,
                skip: 0
            }
        })
        .then(({ data }) => {
            setFailedOrders(data.orders);
            setFailedOrdersCounts(data.ordersCount);
            setFailedSkip(4);
        })
        .catch(( err ) => {
            console.log({err});
        })

        setRefreshing(false);
        
    }
    
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom) {
            getMoreFailedOrder();
        }
    };

    useEffect (() => {
        setLoadingScreen(true);
        handleRefresh();
        setLoadingScreen(false);
    }, [])

    useEffect(() => {
        console.log(failedOrders.length < failedOrdersCount && failedOrdersCount != 0);
        
        if (failedOrders.length < failedOrdersCount) {
            setLoadingFailedPage(true)
        } else {
            setLoadingFailedPage(false)
        }
        
    }, [failedOrders.length])

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
          failedOrders.length == 0 ?
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

            failedOrders.map((order, index) => (
                <OrderCart 
                    key={index}
                    order={order}
                />
            ))
        }
          
        {loadingFailedPage && <View className='w-full h-10 flex justify-center items-center my-5'>
            <LoadingIcon/>
        </View>}

      </ScrollView>

    </View>
  )
}

export default Failed
