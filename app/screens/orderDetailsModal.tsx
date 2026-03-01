import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { handleCall } from '@/lib';
import { DeliveryWorkerType, OrderType } from '@/types';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import moment from 'moment';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
    isVisible: boolean;
    onClose: () => void;
    order: OrderType | null;
    deliveryWorker?: DeliveryWorkerType;
    onUpdateSuccess?: () => void;
};

const OrderDetailsModal = ({ isVisible, onClose, order, deliveryWorker, onUpdateSuccess }: Props) => {
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);
    const { admin } = useAdmin();
    const { setStatusBanner } = useStatusBanner();

    if (!order) return null;

    const handleUpdateStatus = async (newStatus: 'delivered' | 'failed') => {

        if (!admin?.accesses?.includes('Manage Orders')) {
            setStatusBanner(true, "You don't have permission to update order status", "error");
            return;
        }
        try {
            setLoading(true);
            setStatusMessage(null);

            const response = await axios.put(`${backEndUrl}/updateOrderStatus`, {
                orderId: order._id,
                newStatus: newStatus
            });

            if (response.data) {
                setStatusMessage({
                    text: newStatus === 'delivered'
                        ? "Order delivered successfully! 🎉"
                        : "Order marked as failed.",
                    type: newStatus === 'delivered' ? 'success' : 'warning'
                });

                if (onUpdateSuccess) onUpdateSuccess();

                setTimeout(() => {
                    onClose();
                    setStatusMessage(null);
                }, 1800);
            }
        } catch (error) {
            setStatusMessage({
                text: "Failed to update order. Please try again.",
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const subTotal = order.purchases?.reduce((acc, item) => {
        //@ts-ignore
        return acc + (item.specification?.price || 0) * item.quantity;
    }, 0) || 0;

    const shipping = order.shippingCoast || 0;
    const grandTotal = (subTotal + shipping).toFixed(2);

    const getLangText = (field: any) => {
        if (typeof field === 'object' && field !== null) {
            return field.en || field.fr || "";
        }
        return field || "";
    };

    const isOrderFinalized = order.status === 'delivered' || order.status === 'failed';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContainer}>
                    <View className="items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="w-full flex flex-col items-center justify-between px-6 py-5 border-b border-gray-50">
                        <View className='w-full flex-row items-center justify-between'>
                            <View>
                                <View className="flex-row items-center mb-0.5">
                                    <Text className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                        {moment(order.createdAt).format('DD MMM YYYY')} • {moment(order.createdAt).format('HH:mm')}
                                    </Text>
                                    <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                                    <Text className="text-[10px] uppercase font-black text-gray-400 tracking-wide">
                                        {moment(order.createdAt).fromNow()}
                                    </Text>
                                </View>
                                <Text className="text-2xl font-black mt-5 ml-5" style={{ color: colors.dark[100] }}>
                                    #{order.orderNumber}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="bg-gray-100 w-10 h-10 rounded-full items-center justify-center"
                            >
                                <Ionicons name="close" size={22} color={colors.dark[100]} />
                            </TouchableOpacity>
                        </View>

                        <View className="w-full items-center">
                            <View
                                style={{
                                    backgroundColor:
                                        order.status === 'delivered' ? '#f0fdf4' :
                                            order.status === 'failed' ? '#fef2f2' :
                                                '#f9fafb',
                                    borderColor:
                                        order.status === 'delivered' ? '#dcfce7' :
                                            order.status === 'failed' ? '#fee2e2' :
                                                '#f3f4f6'
                                }}
                                className="px-8 py-2.5 rounded-full border flex-row items-center shadow-sm"
                            >
                                <View
                                    className="w-2 h-2 rounded-full mr-3"
                                    style={{
                                        backgroundColor:
                                            order.status === 'delivered' ? '#22c55e' :
                                                order.status === 'failed' ? '#ef4444' :
                                                    '#9ca3af'
                                    }}
                                />
                                <Text
                                    className="text-[12px] uppercase font-black tracking-[2px]"
                                    style={{
                                        color:
                                            order.status === 'delivered' ? '#166534' :
                                                order.status === 'failed' ? '#991b1b' :
                                                    '#4b5563'
                                    }}
                                >
                                    {order.status}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-5">
                        {/* Order Items */}
                        <View className="mb-6">
                            <Text className="text-[11px] font-black mb-4 uppercase text-gray-400 tracking-widest ml-1">Order Items</Text>
                            {order.purchases?.map((item, index) => (
                                <View key={item._id || index} className="bg-white border border-gray-100 rounded-[30px] p-4 mb-3 flex-row items-center shadow-sm">
                                    <Image
                                        //@ts-ignore
                                        source={{ uri: item.product?.thumbNail }}
                                        className="w-16 h-16 rounded-[20px] bg-gray-50"
                                    />
                                    <View className="flex-1 ml-4 justify-between h-16 py-1">
                                        <Text className="font-black text-[13px] text-dark-100" numberOfLines={1}>{
                                            //@ts-ignore
                                            getLangText(item.product?.name)}
                                        </Text>
                                        <View className="flex-row items-end justify-between">
                                            <View>
                                                <Text className="text-[10px] text-gray-400 font-bold">{item.quantity} × {
                                                    //@ts-ignore
                                                    item.specification?.price?.toFixed(2)
                                                } DT</Text>
                                                <Text className="text-[9px] text-gray-500 font-bold mt-0.5">{
                                                    //@ts-ignore
                                                    item.specification?.size} / {item.specification?.color}
                                                </Text>
                                            </View>
                                            <Text className="font-black text-sm" style={{ color: colors.dark[100] }}>{
                                                //@ts-ignore
                                                ((item.specification?.price || 0) * item.quantity).toFixed(2)} DT
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Delivery Info */}
                        <View className="bg-gray-50 rounded-[35px] p-6 mb-6 border border-gray-100">
                            <View className="flex-row items-center mb-5">
                                <FontAwesome5 name="map-marker-alt" size={14} color={colors.dark[100]} />
                                <Text className="ml-3 font-black text-[11px] uppercase text-dark-100 tracking-widest">Delivery Info</Text>
                            </View>
                            <View className="px-1 mb-4">
                                <Text className="text-dark-100 font-black text-lg mb-1">{
                                    //@ts-ignore
                                    order.purchases[0]?.client?.fullName || "Client"}
                                </Text>
                                <Text className="text-gray-500 text-xs leading-5">{getLangText(order.address)}</Text>
                            </View>

                            {/* Client Note Section */}
                            {order.clientNote && (
                                <View className="bg-white/60 border border-gray-200/50 p-4 rounded-2xl mb-5">
                                    <View className="flex-row items-center mb-1.5">
                                        <MaterialCommunityIcons name="note-text-outline" size={14} color="#6b7280" />
                                        <Text className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">Client Note</Text>
                                    </View>
                                    <Text className="text-dark-100 text-[12.5px] font-medium italic">"{order.clientNote}"</Text>
                                </View>
                            )}

                            <View className="gap-y-3">
                                <TouchableOpacity
                                    //@ts-ignore
                                    onPress={() => handleCall(order.purchases[0]?.client?.phone?.toString() || "")}
                                    className="bg-white border border-green-100 h-20 rounded-2xl flex-row items-center px-5 shadow-sm"
                                >
                                    <View className="bg-green-500 w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="call" size={18} color="white" />
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className="text-[9px] text-green-600 font-black uppercase">Client Phone</Text>
                                        <Text className="text-dark-100 font-black text-sm">{
                                            //@ts-ignore
                                            order.purchases[0]?.client?.phone}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="phone-outgoing" size={18} color="#16a34a" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => deliveryWorker?.phone && handleCall(deliveryWorker.phone.toString())} className="bg-white border border-green-100 h-20 rounded-2xl flex-row items-center px-5 shadow-sm">
                                    <View className="bg-green-500 w-10 h-10 rounded-xl items-center justify-center">
                                        <FontAwesome5 name="shipping-fast" size={14} color="white" />
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className="text-[9px] text-green-600 font-black uppercase">Delivery Worker: {deliveryWorker?.fullName || "Not Assigned"}</Text>
                                        <Text className="text-dark-100 font-black text-sm">{deliveryWorker?.phone?.toString() ?? "N/A"}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="phone-outgoing" size={18} color="#16a34a" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Summary */}
                        <View className="bg-white border border-gray-100 rounded-[35px] p-6 mb-10 shadow-sm">
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-gray-400 font-bold text-xs">Items Price</Text>
                                <Text className="font-bold text-dark-100">{subTotal.toFixed(2)} DT</Text>
                            </View>
                            <View className="flex-row justify-between mb-4">
                                <Text className="text-gray-400 font-bold text-xs">Shipping Fee</Text>
                                <Text className="font-bold text-dark-100">+{shipping.toFixed(2)} DT</Text>
                            </View>
                            <View className="h-[1px] bg-gray-50 my-2" />
                            <View className="flex-row justify-between items-center mt-3">
                                <Text className="text-lg font-black" style={{ color: colors.dark[100] }}>Grand Total</Text>
                                <Text
                                    className="text-2xl font-black"
                                    style={{
                                        color: order.status === "failed"
                                            ? "#EF4444"
                                            : order.status === "delivered"
                                                ? "#10B981"
                                                : "#F59E0B"
                                    }}
                                >
                                    {grandTotal} DT
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Result Message Container */}
                    {statusMessage && (
                        <View
                            className={`mx-6 mb-4 p-4 rounded-2xl flex-row items-center ${statusMessage.type === 'success' ? 'bg-green-50 border border-green-100' :
                                    statusMessage.type === 'warning' ? 'bg-orange-50 border border-orange-100' :
                                        'bg-red-50 border border-red-100'
                                }`}
                        >
                            <Ionicons
                                name={statusMessage.type === 'success' ? "checkmark-circle" : "alert-circle"}
                                size={20}
                                color={statusMessage.type === 'success' ? "#16a34a" : statusMessage.type === 'warning' ? "#f97316" : "#ef4444"}
                            />
                            <Text className={`ml-2 font-bold text-[13px] ${statusMessage.type === 'success' ? 'text-green-700' :
                                    statusMessage.type === 'warning' ? 'text-orange-700' :
                                        'text-red-700'
                                }`}>
                                {statusMessage.text}
                            </Text>
                        </View>
                    )}

                    {/* Footer Buttons */}
                    {!isOrderFinalized && (
                        <View className="px-6 py-6 border-t border-gray-50 flex-row gap-x-4 bg-white">
                            <TouchableOpacity
                                disabled={loading}
                                onPress={() => handleUpdateStatus('failed')}
                                className="flex-1 h-16 bg-red-50 rounded-2xl items-center justify-center border border-red-100"
                            >
                                <Text className="font-black text-red-600 uppercase text-[11px] tracking-widest">Failed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={loading}
                                onPress={() => handleUpdateStatus('delivered')}
                                className="flex-[2.5] h-16 bg-green-500 rounded-2xl items-center justify-center flex-row shadow-lg shadow-green-500/30"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                                        <Text className="font-black text-white uppercase text-[11px] ml-3 tracking-widest">Mark Delivered</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.light[100],
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        height: SCREEN_HEIGHT * 0.93,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    }
});

export default OrderDetailsModal;