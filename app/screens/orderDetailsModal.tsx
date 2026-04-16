import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useAdmin } from '@/contexts/admin';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { handleCall } from '@/lib';
import { DeliveryWorkerType, OrderType } from '@/types';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
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

const getSpecImage = (product: any, specIdObj: any) => {
    let imgUri = product?.thumbNail || product?.productThumb;
    if (!product || !product.images || !product.specifications || !specIdObj) return imgUri;
    
    const specId = typeof specIdObj === 'string' ? specIdObj : specIdObj._id;
    const specObj = product.specifications.find((s: any) => s._id === specId);
    
    if (!specObj) return imgUri;

    const normalizeHex = (h?: string | null) => {
        if (!h) return '';
        let v = h.trim().toLowerCase();
        return (v.length === 4 && v.startsWith('#')) ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v;
    };
    
    const specHex = normalizeHex(specObj.colorHex);
    const specColor = specObj.color?.trim().toLowerCase();

    const matchingImg = product.images.find((img: any) => {
        const imgSpecId = typeof img.specification === 'string' ? img.specification : img.specification?._id;
        if (imgSpecId === specId) return true;
        
        const imgSpecObj = imgSpecId ? product.specifications.find((s: any) => s._id === imgSpecId) : null;
        const imgColorHex = normalizeHex(imgSpecObj?.colorHex || img.specification?.colorHex);
        const imgColorName = (imgSpecObj?.color || img.specification?.color)?.trim().toLowerCase();
        
        if (specHex && imgColorHex && specHex === imgColorHex) return true;
        if (specColor && imgColorName && specColor === imgColorName) return true;
        return false;
    });

    if (matchingImg?.uri) return matchingImg.uri;
    return imgUri;
};

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
    const router = useRouter();

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
        const basePrice = (item.specification as any)?.price || (item as any).specPrice || 0;
        const charmsPrice = item.customizedCharms?.reduce((cAcc, pc) => {
            const charmPrice = (pc.spec as any)?.price || (pc.charm as any)?.price || (pc.charm as any)?.specifications?.[0]?.price || 0;
            return cAcc + charmPrice;
        }, 0) || 0;
        return acc + (basePrice + charmsPrice) * (item.quantity || 1);
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

    //@ts-ignore
    const clientInfo = (order.client && typeof order.client === 'object') ? order.client : (order.purchases?.[0]?.client || order.client);

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
                            {order.purchases?.map((item, index) => {
                                const pId = typeof item.product === 'object' ? (item.product as any)?._id : (item.product || (item as any).productId);
                                
                                if (item.isCustomized) {
                                    return (
                                        <View key={item._id || index} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm">
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    if (!pId) return;
                                                    router.push({ pathname: '/screens/productDetails/[id]', params: { id: pId } });
                                                }}
                                                className="flex-row items-center justify-between mb-4"
                                            >
                                                <View className="flex-1">
                                                    <Text className="font-black text-[14px] text-dark-100 mb-1" numberOfLines={1}>
                                                        <Text className="text-purple-600">🪄 DIY - </Text>
                                                        {item.product ? getLangText((item.product as any)?.name) : "Deleted Product"}
                                                    </Text>
                                                    <View className="flex-row items-center justify-between mt-1">
                                                        <View>
                                                            <Text className="text-[11px] text-gray-400 font-bold">{item.quantity} × {
                                                                //@ts-ignore
                                                                item.specification?.price?.toFixed(2)
                                                            } DT</Text>
                                                            <Text className="text-[10px] text-gray-500 font-bold mt-0.5">{
                                                                //@ts-ignore
                                                                item.specification?.size ? item.specification.size + ' / ' : ''}{item.specification?.color}
                                                            </Text>
                                                            {item.customizedCharms && item.customizedCharms.length > 0 && (
                                                                <Text className="text-[10px] text-purple-500 font-bold mt-0.5">
                                                                    +{item.customizedCharms.length} Charms positioned
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <Text className="font-black text-[15px] mr-2" style={{ color: colors.dark[100] }}>
                                                                {//@ts-ignore
                                                                ((item.specification?.price || 0) * item.quantity).toFixed(2)} DT
                                                            </Text>
                                                            <Feather name="chevron-right" size={16} color="#D1D5DB" />
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Full Size Preview */}
                                            <View className="w-full aspect-square rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden relative self-center items-center justify-center">
                                                {typeof item.product === 'object' && (
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => {
                                                            if (!pId) return;
                                                            router.push({ pathname: '/screens/productDetails/[id]', params: { id: pId } });
                                                        }}
                                                        className="w-[85%] h-[85%] absolute"
                                                        style={{ top: '7.5%', left: '7.5%', zIndex: 10 }}
                                                    >
                                                        <Image
                                                            source={{ uri: getSpecImage(item.product, item.specification) }}
                                                            className="w-full h-full"
                                                            resizeMode="contain"
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                                {item.customizedCharms?.map((customCharm, idx) => {
                                                    const charmObj = typeof customCharm.charm === 'object' ? customCharm.charm : null;
                                                    const charmId = (charmObj as any)?._id;
                                                    const charmThumb = charmObj ? getSpecImage(charmObj, customCharm.spec) : null;

                                                    if (!charmThumb) return null;
                                                    
                                                    return (
                                                        <TouchableOpacity 
                                                            key={idx}
                                                            activeOpacity={0.8}
                                                            onPress={() => {
                                                                if (!charmId) return;
                                                                router.push({ pathname: '/screens/productDetails/[id]', params: { id: charmId } });
                                                            }}
                                                            className="absolute"
                                                            style={{
                                                                left: `${customCharm.x}%`,
                                                                top: `${customCharm.y}%`,
                                                                width: '15%',
                                                                aspectRatio: 1,
                                                                marginLeft: '-7.5%',
                                                                marginTop: '-7.5%',
                                                                backgroundColor: 'transparent',
                                                                zIndex: 20
                                                            }}
                                                        >
                                                            <Image
                                                                source={{ uri: charmThumb }}
                                                                className="w-full h-full"
                                                                resizeMode="contain"
                                                            />
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    );
                                }

                                return (
                                    <TouchableOpacity
                                        key={item._id || index}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (!pId) return;
                                            router.push({
                                                pathname: '/screens/productDetails/[id]',
                                                params: { id: pId }
                                            });
                                        }}
                                        className="bg-white border border-gray-100 rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                                    >
                                        {typeof item.product === 'object' && (item.product as any)?.thumbNail ? (
                                            <Image
                                                source={{ uri: (item.product as any)?.thumbNail }}
                                                className="w-16 h-16 rounded-xl bg-gray-50"
                                            />
                                        ) : (
                                            <View className="w-16 h-16 rounded-xl bg-red-50 items-center justify-center">
                                                <MaterialCommunityIcons name="package-variant-remove" size={24} color="#ef4444" />
                                            </View>
                                        )}
                                        <View className="flex-1 ml-4 justify-between h-16 py-1">
                                            <View className="flex-row items-center justify-between">
                                                <Text className={`font-black flex-1 text-[13px] ${!item.product ? 'text-red-500 italic' : 'text-dark-100'}`} numberOfLines={1}>
                                                    {item.product ? getLangText((item.product as any)?.name) : "Deleted Product"}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-end justify-between">
                                                <View>
                                                    <Text className="text-[10px] text-gray-400 font-bold">{item.quantity} × {
                                                        //@ts-ignore
                                                        item.specification?.price?.toFixed(2)
                                                    } DT</Text>
                                                    <Text className="text-[9px] text-gray-500 font-bold mt-0.5">{
                                                        //@ts-ignore
                                                        item.specification?.size ? item.specification.size + ' / ' : ''}{item.specification?.color}
                                                    </Text>
                                                </View>
                                                <View className='flex-row items-center'>
                                                    <Text className="font-black text-sm mr-2" style={{ color: colors.dark[100] }}>
                                                        {(() => {
                                                            const basePrice = (item.specification as any)?.price || (item as any).specPrice || 0;
                                                            const charmsPrice = item.customizedCharms?.reduce((cAcc, pc) => {
                                                                const charmPrice = (pc.spec as any)?.price || (pc.charm as any)?.price || (pc.charm as any)?.specifications?.[0]?.price || 0;
                                                                return cAcc + charmPrice;
                                                            }, 0) || 0;
                                                            return ((basePrice + charmsPrice) * (item.quantity || 1)).toFixed(2);
                                                        })()} DT
                                                    </Text>
                                                    <Feather name="chevron-right" size={14} color="#D1D5DB" />
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Delivery Info */}
                        <View className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-100">
                            <View className="flex-row items-center mb-5">
                                <FontAwesome5 name="map-marker-alt" size={14} color={colors.dark[100]} />
                                <Text className="ml-3 font-black text-[11px] uppercase text-dark-100 tracking-widest">Delivery Info</Text>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    router.push({
                                        pathname: '/screens/clientDetails/[id]',
                                        params: { id: typeof clientInfo === 'object' ? (clientInfo as any)?._id : clientInfo }
                                    });
                                }}
                                className="px-1 mb-4"
                            >
                                <View className='flex-row items-center justify-between'>
                                    <View>
                                        <Text className="text-dark-100 font-black text-lg mb-1">
                                            {typeof clientInfo === 'object' ? (clientInfo as any)?.fullName : "unknown"}
                                        </Text>
                                        <Text className="text-gray-500 text-xs leading-5">{getLangText(order.address)}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={18} color="#D1D5DB" />
                                </View>
                            </TouchableOpacity>

                            {/* Client Note Section */}
                            {order.clientNote && (
                                <View className="bg-white/60 border border-gray-200/50 p-4 rounded-xl mb-5">
                                    <View className="flex-row items-center mb-1.5">
                                        <MaterialCommunityIcons name="note-text-outline" size={14} color="#6b7280" />
                                        <Text className="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">Client Note</Text>
                                    </View>
                                    <Text className="text-dark-100 text-[12.5px] font-medium italic">"{order.clientNote}"</Text>
                                </View>
                            )}

                            <View className="gap-y-3">
                                <TouchableOpacity
                                    onPress={() => handleCall(typeof clientInfo === 'object' ? (clientInfo as any)?.phone?.toString() || "" : "")}
                                    className="bg-white border border-green-100 h-20 rounded-xl flex-row items-center px-5 shadow-sm"
                                >
                                    <View className="bg-green-500 w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="call" size={18} color="white" />
                                    </View>
                                    <View className="ml-4 flex-1">
                                        <Text className="text-[9px] text-green-600 font-black uppercase">Client Phone</Text>
                                        <Text className="text-dark-100 font-black text-sm">
                                            {typeof clientInfo === 'object' ? (clientInfo as any)?.phone || "N/A" : "N/A"}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="phone-outgoing" size={18} color="#16a34a" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => deliveryWorker?.phone && handleCall(deliveryWorker.phone.toString())} className="bg-white border border-green-100 h-20 rounded-xl flex-row items-center px-5 shadow-sm">
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
                        <View className="bg-white border border-gray-100 rounded-xl p-6 mb-10 shadow-sm">
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
                                <Text className="text-lg font-black" style={{ color: colors.dark[100] }}>
                                    {order.status === 'failed' ? 'Transaction Loss' : 'Grand Total'}
                                </Text>
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
                            className={`mx-6 mb-4 p-4 rounded-xl flex-row items-center ${statusMessage.type === 'success' ? 'bg-green-50 border border-green-100' :
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
                                className="flex-1 h-16 bg-red-50 rounded-xl items-center justify-center border border-red-100"
                            >
                                <Text className="font-black text-red-600 uppercase text-[11px] tracking-widest">Failed</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={loading}
                                onPress={() => handleUpdateStatus('delivered')}
                                className="flex-[2.5] h-16 bg-green-500 rounded-xl items-center justify-center flex-row shadow-lg shadow-green-500/30"
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
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        height: SCREEN_HEIGHT * 0.93,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    }
});

export default OrderDetailsModal;