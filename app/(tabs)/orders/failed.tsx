import { colors, icons } from '@/constants'
import OrderCart from '@/components/sub/orderCart'
import { DeliveryWorkerType, OrderType } from '@/types'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, RefreshControl, FlatList, ActivityIndicator, Platform } from 'react-native'
import LoadingIcon from '@/components/sub/loading/loadingIcon'
import axios from 'axios'
import { backEndUrl } from '@/api'

type props = {
    failedOrdersCount: number, 
    setFailedOrdersCounts: (value: number) => void
    deliveryWorker?: DeliveryWorkerType, 
    setDeliveryWorker?: (value: DeliveryWorkerType) => void
    onOrderPress: (order: OrderType) => void
}

const Failed = ({
    failedOrdersCount,
    setFailedOrdersCounts,
    deliveryWorker,
    onOrderPress
}: props) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [failedSkip, setFailedSkip] = useState<number>(0);
    const [failedOrders, setFailedOrders] = useState<OrderType[]>([]);
    const limit = 10;

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "failed", limit: 10, skip: 0 }
            });
            setFailedOrders(data.orders);
            setFailedOrdersCounts(data.ordersCount);
            setFailedSkip(10);
        } catch (err) {
            console.log("Failed Refresh Err:", err);
        } finally {
            setRefreshing(false);
            setInitialLoading(false);
        }
    };

    const getMoreFailedOrder = async () => {
        if (loadingMore || failedOrders.length >= failedOrdersCount) return;

        setLoadingMore(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "failed", limit, skip: failedSkip }
            });
            setFailedOrders(prev => [...prev, ...data.orders]);
            setFailedSkip(prev => prev + limit);
        } catch (err) {
            console.log("Failed Load More Err:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const renderItem = useCallback(({ item }: { item: OrderType }) => (
        <OrderCart 
            order={item}
            deliveryWorker={deliveryWorker!}
            onPress={() => onOrderPress(item)}
        />
    ), [deliveryWorker, onOrderPress]);

    const renderSkeleton = () => (
        <View className="p-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} className="w-full h-44 bg-gray-50 rounded-[35px] mb-6 animate-pulse border border-gray-100" />
            ))}
        </View>
    );

    if (!deliveryWorker) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.light[100] }}>
            {initialLoading && failedOrders.length === 0 ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={failedOrders}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: 120 }}
                    onEndReached={getMoreFailedOrder}
                    onEndReachedThreshold={0.3}
                    className='px-2'
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={handleRefresh}
                            colors={[colors.dark[100]]}
                            tintColor={colors.dark[100]}
                        />
                    }
                    ListEmptyComponent={() => (
                        <View className='w-full items-center py-40 opacity-20'>
                            <Image source={icons.openBoxBlack} className='w-24 h-24' />
                            <Text className="mt-4 font-black text-[10px] uppercase tracking-[3px]">
                                No failed orders found
                            </Text>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                            {loadingMore ? (
                                <View className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-50 flex-row items-center">
                                    <ActivityIndicator size="small" color={colors.dark[100]} />
                                    <Text className="ml-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Loading more failed...
                                    </Text>
                                </View>
                            ) : failedOrders.length > 0 && (
                                <Text className="text-[9px] font-bold text-gray-200 uppercase">
                                    — End of List —
                                </Text>
                            )}
                        </View>
                    )}
                    removeClippedSubviews={Platform.OS === 'android'}
                    initialNumToRender={10}
                    windowSize={5}
                />
            )}
        </View>
    )
}

export default Failed;