import { colors, icons } from '@/constants'
import OrderCart from '@/components/sub/orderCart'
import { DeliveryWorkerType, OrderType } from '@/types'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, RefreshControl, FlatList, ActivityIndicator, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios'
import { backEndUrl } from '@/api'

type props = {
    deliveredOrdersCount: number,
    setDeliveredOrdersCounts: (value: number) => void
    deliveryWorker?: DeliveryWorkerType,
    setDeliveryWorker?: (value: DeliveryWorkerType) => void
    onOrderPress: (order: OrderType) => void
    refreshKey?: number
}

const Delivered = ({
    deliveredOrdersCount,
    setDeliveredOrdersCounts,
    deliveryWorker,
    onOrderPress,
    refreshKey
}: props) => {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [deliveredSkip, setDeliveredSkip] = useState<number>(0);
    const [deliveredOrders, setDeliveredOrders] = useState<OrderType[]>([]);
    const limit = 10;

    // جلب البيانات الأولية
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "delivered", limit: 10, skip: 0 }
            });
            setDeliveredOrders(data.orders);
            setDeliveredOrdersCounts(data.ordersCount);
            setDeliveredSkip(10);
        } catch (err) {
            console.log("Delivered Refresh Err:", err);
        } finally {
            setRefreshing(false);
            setInitialLoading(false);
        }
    };

    // جلب المزيد من الطلبات المستلمة
    const getMoreDeliveredOrder = async () => {
        if (loadingMore || deliveredOrders.length >= deliveredOrdersCount) return;

        setLoadingMore(true);
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrdersByStatus`, {
                params: { status: "delivered", limit, skip: deliveredSkip }
            });
            setDeliveredOrders(prev => [...prev, ...data.orders]);
            setDeliveredSkip(prev => prev + limit);
        } catch (err) {
            console.log("Delivered Load More Err:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        handleRefresh();
    }, [refreshKey]);

    const renderItem = useCallback(({ item }: { item: OrderType }) => (
        <OrderCart
            order={item}
            deliveryWorker={deliveryWorker!}
            onPress={() => onOrderPress(item)}
        />
    ), [deliveryWorker, onOrderPress]);

    // واجهة التحميل الوهمي (Skeleton)
    const renderSkeleton = () => (
        <View className="p-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} className="w-full h-48 bg-gray-100 rounded-[35px] mb-6 animate-pulse" />
            ))}
        </View>
    );

    if (!deliveryWorker) return null;

    return (
        <View style={{ flex: 1, backgroundColor: colors.light[100] }}>
            {initialLoading && deliveredOrders.length === 0 ? (
                renderSkeleton()
            ) : (
                <FlatList
                    data={deliveredOrders}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: 110 + insets.bottom }}
                    onEndReached={getMoreDeliveredOrder}
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
                        <View className='w-full items-center py-40 opacity-30'>
                            <Image source={icons.openBoxBlack} className='w-24 h-24' />
                            <Text className="mt-4 font-black tracking-widest text-[10px] uppercase">
                                No delivered orders yet
                            </Text>
                        </View>
                    )}
                    ListFooterComponent={() => (
                        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                            {loadingMore ? (
                                <View className="flex-row items-center bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                                    <ActivityIndicator size="small" color={colors.dark[100]} />
                                    <Text className="ml-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                        Loading History...
                                    </Text>
                                </View>
                            ) : deliveredOrders.length > 0 && (
                                <View className="items-center">
                                    <View className="w-1 h-1 bg-gray-300 rounded-full mb-2" />
                                    <Text className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                                        End of delivered history
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                    // تحسينات الأداء
                    removeClippedSubviews={Platform.OS === 'android'}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </View>
    )
}

export default Delivered;