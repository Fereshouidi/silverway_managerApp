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
    pendingOrdersCount: number, 
    setPendingOrdersCounts: (value: number) => void
}

const Pending = ({
    pendingOrdersCount,
    setPendingOrdersCounts
}: props) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [ loadingPendingPage, setLoadingPendingPage ] = useState<boolean>(false);
    const [limit, setLimit] = useState<number>(10);
    const [pendingSkip, setPendingSkip] = useState<number>(0);
    const [ pendingOrders, setPendingOrders ] = useState<OrderType[]>([]);
    const { setLoadingScreen } = useLoadingScreen();

    const getMorePendingOrder = async () => {

        setLoadingPendingPage(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "pending",
                limit,
                skip: pendingSkip
            }
        })
        .then(({ data }) => {
            setPendingOrders([...pendingOrders, ...data.orders]);
            setPendingOrdersCounts(data.ordersCount);
            setPendingSkip(pendingSkip + limit);
        })
        .catch(( err ) => {
            console.log({err});
        })
        
        setLoadingPendingPage(false);
    }

    // const handleRefresh = async () => {
    //     setRefreshing(true);
    //     setPendingOrders([]);
    //     setPendingSkip(0);
    //     await getMorePendingOrder(true);
    //     setRefreshing(false);
    // }



    const handleRefresh = async () => {

        setRefreshing(true);

        await axios.get( backEndUrl + "/getOrdersByStatus", {
            params: {
                status: "pending",
                limit: 4,
                skip: 0
            }
        })
        .then(({ data }) => {
            setPendingOrders(data.orders);
            setPendingOrdersCounts(data.ordersCount);
            setPendingSkip(4);
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
            getMorePendingOrder();
        }
    };

    useEffect (() => {
        // setLoadingScreen(true);
        handleRefresh();
        // setLoadingScreen(false);
    }, [])

    useEffect(() => {
        console.log(pendingOrders.length < pendingOrdersCount && pendingOrdersCount != 0);
        
        if (pendingOrders.length < pendingOrdersCount) {
            setLoadingPendingPage(true)
        } else {
            setLoadingPendingPage(false)
        }
        
    }, [pendingOrders.length])

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
            pendingOrders.length == 0 ?
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

                pendingOrders.map((order, index) => (
                    <OrderCart 
                        key={index}
                        order={order}
                    />
                ))
        }
            
            {loadingPendingPage && <View className='w-full h-10 flex justify-center items-center my-5'>
                <LoadingIcon/>
            </View>}

        </ScrollView>
        
    </View>
  )
}

export default Pending
