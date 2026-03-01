import { colors } from '@/constants'
import { calcTotalPrice, handleCall, timeAgo } from '@/lib'
import { DeliveryWorkerType, OrderType } from '@/types'
import React, { memo, useMemo } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type props = {
    order: OrderType;
    deliveryWorker: DeliveryWorkerType | undefined;
    onPress: () => void; 
}

// استخدام memo لمنع إعادة الرندرة غير الضرورية أثناء التمرير في القائمة
const OrderCart = memo(({ order, deliveryWorker, onPress }: props) => {
    
    // حساب التنسيق اللوني بناءً على الحالة
    const theme = useMemo(() => {
        switch (order.status) {
            case 'delivered': return { color: '#22c55e', bg: '#f0fdf4', icon: 'check-decagram' as const };
            case 'failed': return { color: '#ef4444', bg: '#fef2f2', icon: 'alert-circle' as const };
            default: return { color: '#f59e0b', bg: '#fffbeb', icon: 'clock-outline' as const };
        }
    }, [order.status]);

    // حساب السعر الإجمالي مرة واحدة
    const totalPrice = useMemo(() => 
        (calcTotalPrice(order) + (order?.shippingCoast || 0)).toFixed(2), 
    [order]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.card}
            className="mb-4 mx-1"
        >
            <View className="p-4">
                {/* Header: رقم الطلب والحالة */}
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
                            <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.dark[100]} />
                        </View>
                        <View>
                            <Text className="text-dark-100 text-base font-black">#{order.orderNumber}</Text>
                            <Text className="text-gray-400 text-[10px] font-bold">{timeAgo(order.createdAt || "")}</Text>
                        </View>
                    </View>
                    
                    <View style={{ backgroundColor: theme.bg }} className="flex-row items-center px-3 py-1.5 rounded-lg">
                        <MaterialCommunityIcons name={theme.icon} size={14} color={theme.color} />
                        <Text style={{ color: theme.color }} className="ml-1.5 text-[10px] font-black uppercase tracking-tighter">
                            {order.status}
                        </Text>
                    </View>
                </View>

                {/* Middle Section: العميل والعنوان */}
                <View className="flex-row items-center mb-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                    <View className="flex-row mr-3">
                        {order.purchases?.slice(0, 2).map((p, i) => (
                            <View key={p._id} style={[styles.imageWrapper, { marginLeft: i > 0 ? -15 : 0, zIndex: 10 - i }]}>
                                <Image 
                                    //@ts-ignore
                                    source={{ uri: p.product?.thumbNail }} 
                                    className="w-9 h-9 rounded-full bg-gray-200" 
                                />
                            </View>
                        ))}
                    </View>
                    <View className="flex-1">
                        <Text className="text-dark-100 text-[13px] font-black" numberOfLines={1}>
                            {/* @ts-ignore */}
                            {order.purchases[0]?.client?.fullName || "Client Name"}
                        </Text>
                        <Text className="text-gray-500 text-[11px] font-medium" numberOfLines={1}>
                            {typeof order.address === 'string' ? order.address : (order.address as any)?.en || "No Address"}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-[10px] text-gray-400 font-bold uppercase">Total</Text>
                        <Text className="font-black text-[15px]" style={{ color: colors.dark[100] }}>
                            {totalPrice} DT
                        </Text>
                    </View>
                </View>

                {/* Footer: أزرار التواصل */}
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={() => deliveryWorker?.phone && handleCall(deliveryWorker.phone.toString())}
                        style={styles.actionBtn}
                        className="bg-blue-50 border border-blue-100"
                    >
                        <MaterialCommunityIcons name="truck-delivery-outline" size={16} color="#2563eb" />
                        <Text className="ml-2 text-[11px] font-black text-blue-700 uppercase">Driver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        //@ts-ignore
                        onPress={() => handleCall(order.purchases[0]?.client?.phone?.toString() || "")}
                        style={styles.actionBtn}
                        className="bg-green-50 border border-green-100"
                    >
                        <Ionicons name="call" size={16} color="#16a34a" />
                        <Text className="ml-2 text-[11px] font-black text-green-700 uppercase">Client</Text>
                    </TouchableOpacity>

                    <View className="w-11 h-11 items-center justify-center rounded-xl bg-gray-900 shadow-sm shadow-black/20">
                        <Ionicons name="chevron-forward" size={18} color="white" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
});

const styles = StyleSheet.create({
    card: { 
        backgroundColor: 'white', 
        borderRadius: 28, 
        borderWidth: 1,
        borderColor: '#f3f4f6',
        ...Platform.select({ 
            ios: { 
                shadowColor: "#000", 
                shadowOffset: { width: 0, height: 8 }, 
                shadowOpacity: 0.04, 
                shadowRadius: 12 
            }, 
            android: { 
                elevation: 2 
            } 
        }) 
    },
    imageWrapper: { 
        padding: 2, 
        backgroundColor: 'white', 
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#f3f4f6'
    },
    actionBtn: { 
        flex: 1, 
        height: 44, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: 14 
    }
});

export default OrderCart;