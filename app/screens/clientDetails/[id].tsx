"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    Image, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Animated,
    Dimensions,
    Platform,
    Linking
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { timeAgo } from '@/lib';

const { width } = Dimensions.get('window');

const ClientDetails = () => {
    const { id } = useLocalSearchParams();
    const { setStatusBanner } = useStatusBanner();
    const [client, setClient] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [likes, setLikes] = useState<any[]>([]);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Animation states
    const scrollY = useRef(new Animated.Value(0)).current;
    
    const fetchClientData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backEndUrl}/getClientInfoById?id=${id}`);
            
            if (res.data.success) {
                setClient(res.data.client);
                setOrders(res.data.orders || []);
                setLikes(res.data.likes || []);
                setCartItems(res.data.purchasesInCart || []);
            }
        } catch (error) {
            console.error("Fetch Client Error:", error);
            setStatusBanner(true, "Failed to load client record", "error");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchClientData();
    }, [id, fetchClientData]);

    const handleCall = () => {
        if (client?.phone) Linking.openURL(`tel:${client.phone}`);
    };

    const handleWhatsApp = () => {
        if (client?.phone) {
            const cleanPhone = client.phone.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/${cleanPhone}`);
        }
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [10, 0],
        extrapolate: 'clamp',
    });

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={colors.dark[100]} />
                <Text className="mt-4 font-black text-[10px] uppercase tracking-[3px] opacity-20">Accessing Records</Text>
            </View>
        );
    }

    if (!client) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <MaterialCommunityIcons name="account-off-outline" size={80} color="#E5E7EB" />
                <Text className="mt-6 text-xl font-black uppercase text-gray-300">Client Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-8 px-8 py-4 bg-black rounded-xl">
                    <Text className="text-white font-bold uppercase text-xs">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Animated Slim Header */}
            <SafeAreaView 
                edges={['top']} 
                className="absolute top-0 left-0 right-0 z-50 bg-white/95 border-b border-gray-100 shadow-sm"
                style={{
                  height: Platform.OS === 'ios' ? 100 : 70,
                }}
            >
                <View className="flex-row items-center px-4 h-full">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                        <Feather name="arrow-left" size={24} color="black" />
                    </TouchableOpacity>
                    
                    <Animated.View 
                        className="flex-1"
                        style={{ 
                            opacity: headerOpacity,
                            transform: [{ translateY: headerTranslateY }]
                        }}
                    >
                        <Text className="text-sm font-black uppercase tracking-tighter" numberOfLines={1}>
                            {client.name || 'Client Details'}
                        </Text>
                        <Text className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {client.email || 'Retail Partner'}
                        </Text>
                    </Animated.View>
                    
                    <View className="flex-row items-center gap-x-2">
                        <TouchableOpacity onPress={handleCall} className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full border border-gray-100">
                            <Feather name="phone" size={16} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleWhatsApp} className="w-10 h-10 items-center justify-center bg-emerald-50 rounded-full border border-emerald-100">
                            <MaterialCommunityIcons name="whatsapp" size={18} color="#059669" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <Animated.ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={{ 
                    paddingTop: Platform.OS === 'ios' ? 120 : 90,
                    paddingBottom: 50
                }}
            >
                {/* Profile Hero Section */}
                <View className="px-6 mb-10 items-center">
                    <View className="relative">
                        <View className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl shadow-black/20 overflow-hidden bg-gray-100">
                            <Image 
                                source={{ uri: `https://ui-avatars.com/api/?name=${client.name}&background=random&size=200` }} 
                                className="w-full h-full"
                            />
                        </View>
                        <View className="absolute bottom-0 right-0 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white items-center justify-center">
                            <View className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </View>
                    </View>
                    
                    <Text className="mt-6 text-2xl font-black text-center text-gray-900 tracking-tighter uppercase">
                        {client.name}
                    </Text>
                    <Text className="mt-1 text-gray-400 text-sm font-medium">
                        {client.email}
                    </Text>
                    
                    <View className="mt-6 flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#9CA3AF" />
                        <Text className="ml-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Based in {client.address || 'Unknown Region'}
                        </Text>
                    </View>
                </View>

                {/* Engagement Stats */}
                <View className="px-6 mb-10">
                    <View className="flex-row justify-between gap-x-4">
                        <View className="flex-1 bg-blue-50/30 p-5 rounded-2xl border border-blue-100/30">
                            <View className="w-10 h-10 bg-blue-500 rounded-xl items-center justify-center mb-3 shadow-lg shadow-blue-200">
                                <Feather name="shopping-bag" size={18} color="white" />
                            </View>
                            <Text className="text-[9px] font-black text-blue-900/50 uppercase mb-1">Total orders</Text>
                            <Text className="text-xl font-black text-blue-950">{orders.length}</Text>
                        </View>
                        
                        <View className="flex-1 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/30">
                            <View className="w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center mb-3 shadow-lg shadow-emerald-200">
                                <MaterialCommunityIcons name="currency-usd" size={20} color="white" />
                            </View>
                            <Text className="text-[9px] font-black text-emerald-900/50 uppercase mb-1">Lifetime value</Text>
                            <Text className="text-xl font-black text-emerald-950">
                                {orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0).toFixed(2)} DT
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Engagement Info Grid */}
                <View className="px-6 mb-10">
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        <View className="w-[48%] bg-rose-50/30 p-5 rounded-2xl border border-rose-100/30 shadow-sm">
                            <Text className="text-[8px] font-black text-rose-900/40 uppercase tracking-widest mb-3">Wishlist Items</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="font-black text-lg text-rose-900">{likes.length}</Text>
                                <Feather name="heart" size={14} color="#FB7185" />
                            </View>
                        </View>
                        <View className="w-[48%] bg-amber-50/30 p-5 rounded-2xl border border-amber-100/30 shadow-sm">
                            <Text className="text-[8px] font-black text-amber-900/40 uppercase tracking-widest mb-3">In Progress Cart</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="font-black text-lg text-amber-900">{cartItems.length}</Text>
                                <Feather name="shopping-cart" size={14} color="#F59E0B" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Order History */}
                <View className="px-6">
                    <View className="flex-row justify-between items-end mb-6">
                        <View>
                            <Text className="text-xl font-black text-black uppercase tracking-tighter">Order History</Text>
                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Recent Transactions</Text>
                        </View>
                        <TouchableOpacity>
                            <Text className="text-blue-500 text-[10px] font-black uppercase tracking-widest">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {orders.length === 0 ? (
                        <View className="py-10 items-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <MaterialCommunityIcons name="receipt-text-outline" size={40} color="#D1D5DB" />
                            <Text className="mt-3 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No orders found</Text>
                        </View>
                    ) : (
                        orders.map((order, idx) => (
                            <TouchableOpacity 
                                key={order._id || idx}
                                onPress={() => router.push({ pathname: '/screens/orderDetailsModal', params: { orderId: order._id } })}
                                className="mb-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between"
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center mr-4">
                                        <MaterialCommunityIcons name="package-variant-closed" size={24} color="#9CA3AF" />
                                    </View>
                                    <View>
                                        <Text className="font-black text-sm uppercase tracking-tighter">
                                            #{order._id?.slice(-6) || 'N/A'}
                                        </Text>
                                        <Text className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            {order.createdAt ? timeAgo(order.createdAt) : 'Recently'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="font-black text-sm">{order.totalPrice?.toFixed(2) || '0.00'} DT</Text>
                                    <View className={`mt-2 px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                        <Text className={`text-[8px] font-black uppercase ${order.status === 'delivered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {order.status || 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </Animated.ScrollView>
        </View>
    );
};

export default ClientDetails;
