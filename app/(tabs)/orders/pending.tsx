import { colors, icons } from '@/constants'
import OrderCart from '@/components/sub/orderCart'
import { DeliveryWorkerType, OrderType } from '@/types'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, RefreshControl, FlatList, ActivityIndicator } from 'react-native'
import LoadingIcon from '@/components/sub/loading/loadingIcon'
import axios from 'axios'
import { backEndUrl } from '@/api'

type props = {
    pendingOrdersCount: number, 
    setPendingOrdersCounts: (value: number) => void
    deliveryWorker?: DeliveryWorkerType, 
    setDeliveryWorker?: (value: DeliveryWorkerType) => void
    onOrderPress: (order: OrderType) => void
}

const Pending = ({
    pendingOrdersCount,
    setPendingOrdersCounts,
    deliveryWorker, 
    onOrderPress
}: props) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true); // لحالة التحميل الأولية
    const [pendingSkip, setPendingSkip] = useState<number>(0);
    const [pendingOrders, setPendingOrders] = useState<OrderType[]>([]);
    const limit = 10;

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "pending", limit: 10, skip: 0 }
            });
            setPendingOrders(data.orders);
            setPendingOrdersCounts(data.ordersCount);
            setPendingSkip(10);
        } catch (err) {
            console.log("Refresh Err:", err);
        } finally {
            setRefreshing(false);
            setInitialLoading(false);
        }
    };

    const getMorePendingOrder = async () => {
        // نتحقق إذا كنا نحمل بالفعل أو وصلنا للنهاية
        if (loadingMore || pendingOrders.length >= pendingOrdersCount) return;

        setLoadingMore(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "pending", limit, skip: pendingSkip }
            });
            setPendingOrders(prev => [...prev, ...data.orders]);
            setPendingSkip(prev => prev + limit);
        } catch (err) {
            console.log("Load More Err:", err);
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

    // مكون يظهر أثناء جلب البيانات لأول مرة (Skeleton Placeholder)
    const renderSkeleton = () => (
        <View className="p-4 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} className="w-full h-40 bg-gray-100 rounded-[35px] animate-pulse mb-4" />
            ))}
        </View>
    );

    if (!deliveryWorker) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.light[100] }}>
            {initialLoading && pendingOrders.length === 0 ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={pendingOrders}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: 120 }}
                    onEndReached={getMorePendingOrder}
                    onEndReachedThreshold={0.2} // يطلب البيانات قبل الوصول للقاع بـ 20%
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
                        <View className='w-full items-center py-40 opacity-30'>
                            <Image source={icons.openBoxBlack} className='w-24 h-24' />
                            <Text className="mt-4 font-bold tracking-widest text-xs uppercase">No orders at the moment</Text>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
                            {loadingMore ? (
                                <View className="flex-row items-center bg-white px-6 py-2 rounded-full border border-gray-100 shadow-sm">
                                    <ActivityIndicator size="small" color={colors.dark[100]} />
                                    <Text className="ml-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Loading more orders...
                                    </Text>
                                </View>
                            ) : pendingOrders.length >= pendingOrdersCount && pendingOrders.length > 0 ? (
                                <Text className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                    You've reached the end
                                </Text>
                            ) : null}
                        </View>
                    )}
                    removeClippedSubviews={true} 
                    initialNumToRender={7}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </View>
    )
}

export default Pending;