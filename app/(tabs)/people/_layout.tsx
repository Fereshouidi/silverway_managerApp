import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { colors } from '@/constants';
import Header from '@/components/main/header';
import { useAdmin } from '@/contexts/admin';
import ClientsList from './clientsList';
import DeliveryWorker from './deliveryWorker';
import AdminsList from './adminsList';
import axios from 'axios';
import { backEndUrl } from '@/api';

const Tab = createMaterialTopTabNavigator();

export default function UsersPage() {
    const { admin } = useAdmin();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        delivery: any | null
    } | null>(null);

    const [activePage, setActivePage] = useState<"admins" | "deliveryWorker" | "clients">("clients");

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            // Fetch delivery worker data
            const deliveryRes = await axios.get(backEndUrl + '/getDeliveryWorker');

            setData({
                delivery: deliveryRes.data.deliveryWorker 
            });
            
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Permission constants
    const canViewAdmins = admin?.accesses?.includes("View Admins data");
    const canViewDelivery = admin?.accesses?.includes("View delivery worker data");
    const canViewClients = admin?.accesses?.includes("View Clients data");

    // Safety check to prevent Navigator crash
    const hasAnyAccess = canViewClients || canViewDelivery || canViewAdmins;

    // 1. Loading State
    if (loading) {
        return (
            <SafeAreaView 
                className='flex-1 justify-center items-center' 
                style={{ backgroundColor: colors.light[100], minHeight: '100%' }}
            >
                <ActivityIndicator size="large" color={colors.dark[100]} />
            </SafeAreaView>
        );
    }

    // 2. No Permissions State (Prevents the "No screens for the navigator" error)
    if (!hasAnyAccess) {
        return (
            <SafeAreaView 
                className='flex-1' 
                style={{ backgroundColor: colors.light[100], minHeight: '100%' }}
            >
                <Header title='People Management' />
                <View className="flex-1 justify-center items-center p-5">
                    <Text style={{ color: colors.dark[100], fontSize: 16, textAlign: 'center' }}>
                        You do not have permission to view any sections in this page.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // 3. Main Render
    return (
        <SafeAreaView 
            className='flex-1' 
            style={{ backgroundColor: colors.light[100], minHeight: '100%' }}
        >
            {/* Top background fill */}
            <View 
                className='w-full h-[45px] absolute top-0'
                style={{ backgroundColor: colors.light[100] }}
            />

            <View style={{ backgroundColor: colors.light[100] }}>
                <Header
                    title='People Management'
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>

            <Tab.Navigator
                screenListeners={{
                    state: (e) => {
                        const state = e.data.state;
                        if (state && state.routes[state.index]) {
                            const routeName = state.routes[state.index].name;
                            if (routeName === "Admins") setActivePage("admins");
                            else if (routeName === "Delivery") setActivePage("deliveryWorker");
                            else if (routeName === "Clients") setActivePage("clients");
                        }
                    },
                }}
                screenOptions={{
                    tabBarActiveTintColor: colors.dark[100],
                    tabBarInactiveTintColor: colors.light[700],
                    tabBarIndicatorStyle: { backgroundColor: colors.dark[100], height: 3 },
                    tabBarStyle: { backgroundColor: colors.light[100] },
                    tabBarLabelStyle: { fontWeight: 'bold', fontSize: 13, textTransform: 'none' },
                }}
            >
                {canViewClients && (
                    <Tab.Screen 
                        name="Clients" 
                        children={() => <ClientsList />}
                    />
                )}

                {canViewDelivery && (
                    <Tab.Screen 
                        name="Delivery" 
                        children={() => (
                            <DeliveryWorker 
                                workerData={data?.delivery} 
                                onRefresh={fetchInitialData}
                            />
                        )}
                    />
                )}

                {canViewAdmins && (
                    <Tab.Screen 
                        name="Admins" 
                        children={() => <AdminsList />}
                    />
                )}
            </Tab.Navigator>
        </SafeAreaView>
    );
}