import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { calcTotalPrice, handleCall, handleWhatsApp, renderMessageContent } from '@/lib';
import { ProductType } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ClientDetails = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { setStatusBanner } = useStatusBanner();

    // UI States
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);

    const [showCartModal, setShowCartModal] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    // Data States
    const [client, setClient] = useState<any>(null);
    const [formData, setFormData] = useState<any>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
    const [likedProducts, setLikedProducts] = useState<ProductType[]>([]);
    const [chatHistory, setChatHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllClientData = async () => {
            try {
                const { data } = await axios.get(`${backEndUrl}/getClientInfoById`, {
                    params: { id: id }
                });

                console.log(JSON.stringify(data, null, 2));

                if (data.success) {
                    setClient(data.client);
                    setFormData(data.client);

                    // --- الإصلاح هنا فقط ---
                    // 1. استخراج المنتجات من السلة (تأكد من الوصول لـ p.product)
                    const cart = data.purchasesInCart
                        ? data.purchasesInCart.map((p: any) => p.product).filter(Boolean)
                        : [];
                    setCartItems(cart);

                    // 2. استخراج المنتجات من الإعجابات (تأكد من الوصول لـ l.product)
                    const likes = data.likes
                        ? data.likes.map((l: any) => l.product).filter(Boolean)
                        : [];
                    setLikedProducts(likes);
                    // -----------------------

                    setOrdersHistory(data.orders || []);
                    setChatHistory(data.chats || []);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                setStatusBanner(true, "Could not retrieve full client intelligence.", "error");
            } finally {
                setFetching(false);
            }
        };
        if (id) fetchAllClientData();
    }, [id]);

    const renderProductList = (products: ProductType[], emptyMessage: string) => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {products.length > 0 ? products.map((item, idx) => {
                const productImage = item.thumbNail || (item.images && item.images.length > 0 ? item.images[0].uri : null);

                return (
                    <View key={item._id || idx.toString()} className="flex-row items-center mb-4 bg-gray-50 p-4 rounded-[25px] border border-gray-100">
                        <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4 shadow-sm overflow-hidden">
                            {productImage ? (
                                <Image source={{ uri: productImage }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <MaterialCommunityIcons name="package-variant" size={24} color={colors.dark[100]} />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-black text-black" numberOfLines={1}>
                                {item.name?.en || item.name?.fr || 'Unknown Product'}
                            </Text>
                            <Text className="text-[10px] text-black/40 font-bold uppercase mt-1">
                                {item.collections && item.collections.length > 0
                                    ? "Featured Collection"
                                    : 'No Collections'}
                            </Text>
                        </View>
                        <Text className="text-sm font-black text-emerald-600">
                            ${item.price ?? 0}
                        </Text>
                    </View>
                );
            }) : (
                <View className="py-10 items-center">
                    <MaterialCommunityIcons name="emoticon-sad-outline" size={40} color={colors.dark[100]} style={{ opacity: 0.1 }} />
                    <Text className="text-xs text-black/30 font-bold mt-4 uppercase tracking-widest">{emptyMessage}</Text>
                </View>
            )}
        </ScrollView>
    );

    const handleSave = async () => {
        if (!formData) return;
        setLoading(true);
        Keyboard.dismiss();
        try {
            const { data } = await axios.put(`${backEndUrl}/updateClient`, { updatedClientData: formData });
            if (data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setClient(formData);
                setTimeout(() => {
                    setIsEditing(false);
                    setLoading(false);
                    setStatusBanner(true, "Client profile synchronized successfully.", "success");
                }, 600);
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setLoading(false);
            setStatusBanner(true, "Update failed.", "error");
        }
    };

    if (fetching || !client) {
        return (
            <View className="flex-1 justify-center items-center" style={{ minHeight: '100%', backgroundColor: colors.light[100] }}>
                <ActivityIndicator color={colors.dark[100]} size="large" />
                <Text className="mt-4 text-[10px] font-bold opacity-30 uppercase tracking-[3px]">Gathering Intelligence...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ minHeight: '100%', backgroundColor: colors.light[100] }}>
            <View style={{ height: 50, backgroundColor: colors.light[100] }} />

            <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <MaterialCommunityIcons name="chevron-left" size={28} color={colors.dark[100]} />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/30">Intelligence</Text>
                    <Text className="text-base font-black text-black">{isEditing ? 'Editor' : client.fullName}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    style={{ backgroundColor: isEditing ? colors.dark[100] : '#f3f4f6' }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                >
                    <MaterialCommunityIcons name={loading ? "dots-horizontal" : (isEditing ? "check" : "pencil-outline")} size={20} color={isEditing ? colors.light[100] : colors.dark[100]} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                    <View className="flex-row justify-between mb-8">
                        {[{ label: 'Orders', val: ordersHistory.length }, { label: 'Cart', val: cartItems.length }, { label: 'Likes', val: likedProducts.length }, { label: 'Chats', val: chatHistory.length }].map((s, i) => (
                            <View key={i} className="bg-white rounded-[25px] p-3 items-center border border-gray-50 shadow-sm" style={{ width: '22%' }}>
                                <Text className="text-sm font-black text-black">{s.val}</Text>
                                <Text className="text-[7px] font-bold uppercase opacity-30 mt-1">{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm mb-6">
                        <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-6">Identity Records</Text>
                        {[
                            { label: 'Full Name', key: 'fullName', icon: 'account-circle-outline' },
                            { label: 'Phone', key: 'phone', icon: 'phone-outline', kb: 'phone-pad' },
                            { label: 'Email', key: 'email', icon: 'email-outline', kb: 'email-address' },
                            { label: 'Address', key: 'address', icon: 'map-marker-outline' }
                        ].map((item, idx) => (
                            <View key={idx} className="mb-6 last:mb-0">
                                <View className="flex-row items-center mb-1">
                                    <MaterialCommunityIcons name={item.icon as any} size={14} color={colors.dark[100]} style={{ opacity: 0.2 }} />
                                    <Text className="text-[9px] font-bold text-black/30 uppercase ml-2 tracking-tighter">{item.label}</Text>
                                </View>
                                {isEditing ? (
                                    <TextInput
                                        className="text-base font-bold text-black border-b border-gray-100 pb-1"
                                        value={String(formData[item.key] || "")}
                                        onChangeText={(t) => setFormData({ ...formData, [item.key]: t })}
                                        keyboardType={item.kb as any || 'default'}
                                    />
                                ) : (
                                    <Text className="text-base font-bold text-black">{client[item.key] || '—'}</Text>
                                )}
                            </View>
                        ))}
                    </View>

                    <View className="mb-6">
                        <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px] mb-4 ml-2">Marketplace Interest</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCartModal(true); }} className="bg-white p-5 rounded-[30px] border border-gray-100 mr-4 w-44 shadow-sm">
                                <MaterialCommunityIcons name="cart-variant" size={22} color={colors.dark[100]} />
                                <Text className="text-sm font-black mt-3">{cartItems.length} Products</Text>
                                <Text className="text-[10px] text-black/40 font-bold uppercase mt-1">Pending in Cart</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLikesModal(true); }} className="bg-white p-5 rounded-[30px] border border-gray-100 mr-4 w-44 shadow-sm">
                                <MaterialCommunityIcons name="heart" size={22} color="#F43F5E" />
                                <Text className="text-sm font-black mt-3">{likedProducts.length} Favorites</Text>
                                <Text className="text-[10px] text-black/40 font-bold uppercase mt-1">Wishlist Activity</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <View className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm mb-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px]">Order History</Text>
                            {ordersHistory.length > 5 && (
                                <TouchableOpacity onPress={() => setShowOrdersModal(true)} className="px-2 py-1">
                                    <Text style={{ color: colors.dark[100] }} className="text-[10px] font-bold uppercase">View All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {ordersHistory.length > 0 ? ordersHistory.slice(0, 5).map((order, idx) => (
                            <View key={idx} className="flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0">
                                <View className="flex-row items-center">
                                    <View className={`w-2 h-2 rounded-full mr-3 ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <View>
                                        <Text className="text-xs font-black text-black">Order #{order.orderNumber}</Text>
                                        <Text className="text-[9px] text-black/40 font-bold uppercase">{order.status}</Text>
                                    </View>
                                </View>
                                <Text className="text-xs font-black text-black">${(calcTotalPrice(order) || 0) + (order.shippingCoast || 0)}</Text>
                            </View>
                        )) : (
                            <Text className="text-xs text-black/30 text-center py-4">No transactions found.</Text>
                        )}
                    </View>

                    <View style={{ backgroundColor: colors.dark[100] }} className="rounded-[35px] p-7 shadow-2xl shadow-black/40 mb-6">
                        <View className="flex-row items-center mb-5">
                            <View className="bg-white/20 p-2 rounded-xl">
                                <MaterialCommunityIcons name="robot-outline" size={18} color={colors.light[100]} />
                            </View>
                            <Text className="text-[10px] font-black text-white/40 uppercase tracking-[2px] ml-3">AI Intelligence Logs</Text>
                        </View>
                        {chatHistory.length > 0 ? (
                            <View className="bg-white/5 border border-white/10 rounded-[25px] p-5">
                                <Text className="text-white/80 text-[12px] leading-5" numberOfLines={3}>
                                    {chatHistory[0].summary.replace(/\*+/g, '')}
                                </Text>
                                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSummary(true); }} className="mt-4 bg-white/10 py-2 px-4 rounded-xl self-start">
                                    <Text className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Read Full Summary</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text className="text-white/20 text-xs text-center font-bold py-4">No records found.</Text>
                        )}
                        <TouchableOpacity className="mt-6 py-4 bg-white/10 rounded-2xl items-center border border-white/5" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowTranscript(true); }}>
                            <Text style={{ color: colors.light[100] }} className="font-black text-[10px] uppercase tracking-[3px]">Open Live Messages</Text>
                        </TouchableOpacity>
                    </View>

                    {!isEditing && (
                        <View className="flex-row gap-4">
                            <TouchableOpacity style={{ backgroundColor: colors.dark[100] }} className="flex-1 h-16 rounded-[25px] flex-row items-center justify-center shadow-lg" onPress={() => handleCall(client.phone.toString())}>
                                <MaterialCommunityIcons name="phone" size={20} color={colors.light[100]} />
                                <Text style={{ color: colors.light[100] }} className="font-black ml-2 uppercase text-[12px] tracking-widest">Call Client</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ backgroundColor: colors.light[100] }} className="w-16 h-16 border border-gray-100 rounded-[25px] items-center justify-center shadow-sm" onPress={() => handleWhatsApp(client.phone.toString())}>
                                <MaterialCommunityIcons name="whatsapp" size={28} color="#25D366" />
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals remain exactly as they were */}
            <Modal animationType="fade" transparent={true} visible={showSummary} onRequestClose={() => setShowSummary(false)}>
                <View className="flex-1 bg-black/80 justify-center px-6">
                    <View style={{ backgroundColor: colors.light[100] }} className="rounded-[40px] p-8 max-h-[70%] shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-black text-black">AI Summary</Text>
                            <TouchableOpacity onPress={() => setShowSummary(false)} className="bg-gray-100 p-2 rounded-full">
                                <MaterialCommunityIcons name="close" size={20} color={colors.dark[100]} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {chatHistory[0]?.summary.split('\n').map((line: string, i: number) => (
                                <Text key={i} className="text-gray-600 text-[13px] leading-6 mb-2">{line.replace(/\*+/g, '').trim()}</Text>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={showTranscript} onRequestClose={() => setShowTranscript(false)}>
                <View className="flex-1 bg-black/90 justify-end">
                    <View style={{ backgroundColor: colors.light[100] }} className="rounded-t-[40px] h-[90%] p-6">
                        <View className="flex-row justify-between items-center mb-6 px-2">
                            <View><Text className="text-2xl font-black text-black">Live Chat</Text></View>
                            <TouchableOpacity onPress={() => setShowTranscript(false)} className="bg-black/5 p-3 rounded-full">
                                <MaterialCommunityIcons name="close" size={24} color={colors.dark[100]} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className='bg-blue-500- max-h-10-' showsVerticalScrollIndicator={false}>
                            {chatHistory[0]?.messages?.map((msg: any, i: number) => (
                                <View key={i} className={`mb-4 max-w-[92%] h-fit ${msg.role === 'assistant' ? 'self-start' : 'self-end'}`}>
                                    <View className={`p-4 rounded-[25px] h-fit ${msg.role === 'assistant' ? 'bg-white border border-gray-100' : 'bg-black'}`}>
                                        {renderMessageContent(msg.content, msg.role === 'assistant')}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={showCartModal} onRequestClose={() => setShowCartModal(false)}>
                <View className="flex-1 bg-black/80 justify-end">
                    <View style={{ backgroundColor: colors.light[100] }} className="rounded-t-[40px] h-[70%] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-xl font-black text-black">Cart Items</Text>
                            <TouchableOpacity onPress={() => setShowCartModal(false)} className="bg-gray-100 p-2 rounded-full"><MaterialCommunityIcons name="close" size={20} /></TouchableOpacity>
                        </View>
                        {renderProductList(cartItems, "Cart is empty")}
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={showLikesModal} onRequestClose={() => setShowLikesModal(false)}>
                <View className="flex-1 bg-black/80 justify-end">
                    <View style={{ backgroundColor: colors.light[100] }} className="rounded-t-[40px] h-[70%] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-xl font-black text-black">Favorites</Text>
                            <TouchableOpacity onPress={() => setShowLikesModal(false)} className="bg-gray-100 p-2 rounded-full"><MaterialCommunityIcons name="close" size={20} /></TouchableOpacity>
                        </View>
                        {renderProductList(likedProducts, "No favorites yet")}
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={showOrdersModal} onRequestClose={() => setShowOrdersModal(false)}>
                <View className="flex-1 bg-black/80 justify-end">
                    <View style={{ backgroundColor: colors.light[100] }} className="rounded-t-[40px] h-[70%] p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-xl font-black text-black">All Orders</Text>
                            <TouchableOpacity onPress={() => setShowOrdersModal(false)} className="bg-gray-100 p-2 rounded-full"><MaterialCommunityIcons name="close" size={20} /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {ordersHistory.map((order, idx) => (
                                <View key={idx} className="flex-row items-center justify-between p-4 mb-3 bg-white rounded-[15px] border border-gray-50 shadow-sm">
                                    <View>
                                        <Text className="text-sm font-black text-black">Order #{order.orderNumber}</Text>
                                        <Text className="text-[10px] text-black/40 font-bold uppercase">{order.status}</Text>
                                    </View>
                                    <Text className="text-sm font-black text-emerald-600">${(calcTotalPrice(order) || 0) + (order.shippingCoast || 0)}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default ClientDetails;