import { router, Tabs } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/main/header';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { colors } from '@/constants';
import { View } from 'react-native';
import Pending from './pending';
import Delivered from './delivered';
import Failed from './failed';
import { DeliveryWorkerType, OrderType } from '@/types';
import { useLoadingScreen } from '@/contexts/loadingScreen';
import axios from 'axios';
import { backEndUrl } from '@/api';
import OrderDetailsModal from '@/app/screens/orderDetailsModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();

export default function TabLayout() {
    const { setLoadingScreen } = useLoadingScreen();

    // --- States ---
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [deliveryWorker, setDeliveryWorker] = useState<DeliveryWorkerType | undefined>(undefined);

    const [pendingOrdersCount, setPendingOrdersCounts] = useState<number>(0);
    const [failedOrdersCount, setFailedOrdersCounts] = useState<number>(0);
    const [deliveredOrdersCount, setDeliveredOrdersCounts] = useState<number>(0);
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // --- Callbacks (Optimized) ---
    const handleUpdateSuccess = useCallback(() => {
        get_status_counts();
        setRefreshKey(prev => prev + 1);
    }, []);

    const openOrderDetails = useCallback((order: OrderType) => {
        setSelectedOrder(order);
        setModalVisible(true);
    }, []);

    const closeOrderDetails = useCallback(() => {
        setModalVisible(false);
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getDeliveryWorker`);
                setDeliveryWorker(data.deliveryWorker);
            } catch (err) {
                console.log("Worker Fetch Err:", err);
            }
        };
        fetchWorker();
        get_status_counts();
    }, []);

    const get_status_counts = async () => {
        try {
            const { data } = await axios.get(`${backEndUrl}/getOrderStatusCounts`);
            setPendingOrdersCounts(data.pendingOrdersCount);
            setFailedOrdersCounts(data.failedOrdersCount);
            setDeliveredOrdersCounts(data.deliveredOrdersCount);
        } catch (err) {
            console.log("Counts Fetch Err:", err);
        }
    };

    // --- UI Optimization (Memoized Modal) ---
    // هذا الجزء هو السر في السرعة: المودال لن يعيد الرندرة إلا إذا تغير الطلب المختار
    const renderModal = useMemo(() => (
        <OrderDetailsModal
            isVisible={isModalVisible}
            onClose={closeOrderDetails}
            order={selectedOrder}
            deliveryWorker={deliveryWorker}
            onUpdateSuccess={handleUpdateSuccess}
        />
    ), [isModalVisible, selectedOrder, deliveryWorker, closeOrderDetails, handleUpdateSuccess]);

    return (
        <SafeAreaView className='w-full h-full' style={{ backgroundColor: colors.light[100] }}>
            {/* Safe Area Background Fix */}
            {/* <View className='w-full h-[45px]' style={{ backgroundColor: colors.light[100] }} /> */}

            <Header title='orders' className='h-7-' onBackButtonPress={() => router.back()} />

            <Tab.Navigator
                initialRouteName="Pending"
                screenOptions={{
                    tabBarActiveTintColor: colors.dark[100],
                    tabBarIndicatorStyle: { backgroundColor: colors.dark[100], height: 3 },
                    tabBarStyle: { backgroundColor: colors.light[100] },
                    lazy: true, // تحميل التاب فقط عند الضغط عليه لتوفير الموارد
                    swipeEnabled: true,
                }}
            >
                <Tab.Screen
                    name="Pending"
                    options={{ title: `Pending (${pendingOrdersCount})` }}
                >
                    {() => <Pending
                        pendingOrdersCount={pendingOrdersCount}
                        setPendingOrdersCounts={setPendingOrdersCounts}
                        deliveryWorker={deliveryWorker}
                        setDeliveryWorker={setDeliveryWorker}
                        onOrderPress={openOrderDetails}
                        refreshKey={refreshKey}
                    />}
                </Tab.Screen>

                <Tab.Screen
                    name="Failed"
                    options={{ title: `Failed (${failedOrdersCount})` }}
                >
                    {() => <Failed
                        failedOrdersCount={failedOrdersCount}
                        setFailedOrdersCounts={setFailedOrdersCounts}
                        deliveryWorker={deliveryWorker}
                        setDeliveryWorker={setDeliveryWorker}
                        onOrderPress={openOrderDetails}
                        refreshKey={refreshKey}
                    />}
                </Tab.Screen>

                <Tab.Screen
                    name="Delivered"
                    options={{ title: `Delivered (${deliveredOrdersCount})` }}
                >
                    {() => <Delivered
                        deliveredOrdersCount={deliveredOrdersCount}
                        setDeliveredOrdersCounts={setDeliveredOrdersCounts}
                        deliveryWorker={deliveryWorker}
                        setDeliveryWorker={setDeliveryWorker}
                        onOrderPress={openOrderDetails}
                        refreshKey={refreshKey}
                    />}
                </Tab.Screen>
            </Tab.Navigator>

            {/* المودال المركزي: الآن يعمل خارج سياق الـ Tabs لضمان السرعة */}
            {renderModal}
        </SafeAreaView>
    );
}