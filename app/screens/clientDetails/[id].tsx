import { backEndUrl } from '@/api';
import LiveChatModal from '@/components/main/liveChatModal';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { calcTotalPrice, handleCall, handleWhatsApp, isValidEmail, isValidPhone, timeAgo } from '@/lib';
import { ProductType, OrderType, DeliveryWorkerType } from '@/types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import OrderDetailsModal from '@/app/screens/orderDetailsModal';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import Markdown, { ASTNode } from 'react-native-markdown-display';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [fetchingChat, setFetchingChat] = useState(false);

  // Data States
  const [client, setClient] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [likedProducts, setLikedProducts] = useState<ProductType[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(5);

  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [deliveryWorker, setDeliveryWorker] = useState<DeliveryWorkerType | undefined>(undefined);

  // Derived data
  const deliveredOrders = useMemo(() =>
    ordersHistory.filter(o => o.status === 'delivered'), [ordersHistory]);

  const lifetimeValue = useMemo(() =>
    deliveredOrders.reduce((acc, order) => acc + (calcTotalPrice(order) || 0) + (order.shippingCoast || 0), 0),
    [deliveredOrders]);

  const initials = useMemo(() => {
    if (!client?.fullName) return '?';
    const parts = client.fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }, [client?.fullName]);

  useEffect(() => {
    const fetchAllClientData = async () => {
      try {
        const { data } = await axios.get(`${backEndUrl}/getClientInfoById`, {
          params: { id: id },
        });

        if (data.success) {
          setClient(data.client);
          setFormData(data.client);

          // Preserve full purchase objects to allow deletion by purchase ID
          setCartItems(data.purchasesInCart || []);
          setLikedProducts(data.likes?.map((l: any) => l.product).filter(Boolean) || []);
          setOrdersHistory(data.orders || []);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setStatusBanner(true, 'Could not retrieve client intelligence.', 'error');
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchAllClientData();
  }, [id]);

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
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!id) return;

      try {
        setFetchingChat(true);
        const { data } = await axios.post(`${backEndUrl}/getChatHistory`, {
          clientId: id,
          limit: 100, // Fetch a good chunk for the manager
          skip: 0
        });

        // The endpoint now returns the full chat object
        if (data && typeof data === 'object') {
          // Wrap in array for backward compatibility with component expectations
          setChatHistory([data]);

          // If the chat has a summary, we can also update the client's summary field 
          // to ensure both UI locations are in sync
          if (data.summary) {
            setClient((prev: any) => ({
              ...prev,
              summary: data.summary
            }));
          }
        }
      } catch (error) {
        console.error('Chat fetch error:', error);
      } finally {
        setFetchingChat(false);
      }
    };

    if (id) fetchChatHistory();
  }, [id]);

  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { data } = await axios.delete(`${backEndUrl}/deletePurchase`, {
        params: { id: purchaseId },
      });

      if (data.success) {
        setCartItems((prev) => prev.filter((item) => item._id !== purchaseId));
        setStatusBanner(true, 'Item removed from client cart.', 'success');
      }
    } catch (error) {
      setStatusBanner(true, 'Failed to remove item.', 'error');
    }
  };

  const renderProductList = (items: any[], emptyMessage: string, isCart: boolean = false) => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {items.length > 0 ? (
        items.map((entry, idx) => {
          const item = isCart ? entry.product : entry;
          const purchaseId = isCart ? entry._id : null;

          if (!item) return null;

          const productImage =
            item.thumbNail || (item.images && item.images.length > 0 ? item.images[0].uri : null);

          return (
            <TouchableOpacity
              key={idx.toString()}
              activeOpacity={0.8}
              onPress={() => {
                setShowCartModal(false);
                setShowLikesModal(false);
                router.push({
                  pathname: '/screens/productDetails/[id]',
                  params: { id: item._id }
                });
              }}
              className="flex-row items-center mb-3 bg-white p-4 rounded-2xl border border-gray-100/80"
            >
              {/* Image Container */}
              <View className="w-14 h-14 bg-gray-50 rounded-xl items-center justify-center mr-4 overflow-hidden">
                {productImage ? (
                  <Image
                    source={{ uri: productImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={24}
                    color={colors.dark[100]}
                    style={{ opacity: 0.1 }}
                  />
                )}
              </View>

              {/* Info Section */}
              <View className="flex-1 justify-center">
                <Text className="text-[13px] font-bold text-black mb-1" numberOfLines={1}>
                  {typeof item.name === 'object'
                    ? (item.name?.en || item.name?.fr || 'Unknown Product')
                    : (item.name || 'Unknown Product')}
                </Text>
                {isCart && entry.specification ? (
                  <View className="flex-row items-center bg-gray-50 self-start px-2.5 py-1 rounded-lg">
                    <Text className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">
                      {entry.specification.color || 'Standard'} · {entry.specification.size || 'Uni'} × {entry.quantity || 1}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-gray-400 font-medium">
                    Official Item
                  </Text>
                )}
              </View>

              {/* Price & Actions */}
              <View className="items-end ml-3">
                <Text className="text-sm font-bold text-black mb-1">
                  {item.price ?? 0} DT
                </Text>

                {isCart && purchaseId ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePurchase(purchaseId);
                    }}
                    className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg"
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={11} color="#EF4444" />
                    <Text className="text-[8px] font-bold text-red-500 uppercase ml-1">Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <Feather name="chevron-right" size={16} color="#D1D5DB" />
                )}
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View className="py-20 items-center justify-center">
          <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-5">
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={28}
              color={colors.dark[100]}
              style={{ opacity: 0.08 }}
            />
          </View>
          <Text className="text-[10px] text-gray-300 font-bold uppercase tracking-[2px] text-center px-10 leading-4">
            {emptyMessage}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const handleSave = async () => {
    if (!formData) return;

    // Validation
    if (formData.email && !isValidEmail(formData.email)) {
      setStatusBanner(true, 'Please provide a valid email address.', 'warning');
      return;
    }

    if (formData.phone && !isValidPhone(String(formData.phone))) {
      setStatusBanner(true, 'Phone number must be exactly 8 digits.', 'warning');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const { data } = await axios.put(`${backEndUrl}/updateClient`, {
        updatedClientData: formData,
      });

      if (data.success) {
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setClient(formData);
        setTimeout(() => {
          setIsEditing(false);
          setLoading(false);
          setStatusBanner(true, 'Client profile synchronized successfully.', 'success');
        }, 600);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatusBanner(true, 'Update failed.', 'error');
    } finally {
      if (!isEditing) setLoading(false); // safety
    }
  };

  // ========== LOADING STATE ==========
  if (fetching || !client) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: '#FAFAFA' }}
      >
        <View className="w-16 h-16 bg-black/5 rounded-2xl items-center justify-center mb-5">
          <ActivityIndicator color={colors.dark[100]} size="small" />
        </View>
        <Text className="text-[10px] font-bold opacity-20 uppercase tracking-[3px]">
          Loading Profile
        </Text>
      </View>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <View className="flex-1" style={{ backgroundColor: '#FAFAFA' }}>
      <StatusBar barStyle="dark-content" />

      {/* ==================== HEADER ==================== */}
      <View className="px-5 pt-14 pb-3 flex-row justify-between items-center" style={{ backgroundColor: '#FAFAFA' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 bg-white rounded-xl items-center justify-center border border-gray-100/60"
        >
          <Feather name="arrow-left" size={20} color="#1a1a1a" />
        </TouchableOpacity>

        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-gray-300">
          Client Profile
        </Text>

        <TouchableOpacity
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={`w-11 h-11 rounded-xl items-center justify-center ${isEditing ? 'bg-black' : 'bg-white border border-gray-100/60'}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isEditing ? 'white' : 'black'} />
          ) : (
            <Feather
              name={isEditing ? 'check' : 'edit-2'}
              size={16}
              color={isEditing ? 'white' : '#1a1a1a'}
            />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* ==================== PROFILE HERO ==================== */}
          <View className="items-center pt-4 pb-6">
            {/* Avatar Circle */}
            <View className="w-20 h-20 bg-black rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-black">{initials}</Text>
            </View>
            <Text className="text-xl font-black text-black mb-1">
              {client.fullName || 'Unknown Client'}
            </Text>
            <Text className="text-[11px] text-gray-400 font-medium">
              {client.email || client.phone ? `${client.phone || ''}${client.phone && client.email ? ' · ' : ''}${client.email || ''}` : 'No contact info'}
            </Text>
            {client.address && (
              <View className="flex-row items-center mt-2">
                <Feather name="map-pin" size={11} color="#9CA3AF" />
                <Text className="text-[11px] text-gray-400 font-medium ml-1">{client.address}</Text>
              </View>
            )}
          </View>

          {/* ==================== LIFETIME VALUE CARD ==================== */}
          <View className="mx-5 mb-4 bg-black rounded-2xl p-6 overflow-hidden">
            <View className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full -mr-20 -mt-20" />
            <View className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.02] rounded-full -ml-12 -mb-12" />

            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/30 text-[9px] font-bold uppercase tracking-[2px] mb-2">Lifetime Value</Text>
                <Text className="text-white text-3xl font-black">
                  {lifetimeValue.toFixed(0)} <Text className="text-lg text-white/60">DT</Text>
                </Text>
              </View>
              <View className="bg-emerald-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                  {deliveredOrders.length} {deliveredOrders.length === 1 ? 'order' : 'orders'}
                </Text>
              </View>
            </View>

            {/* Mini Stats Row */}
            <View className="flex-row mt-5 pt-5 border-t border-white/[0.06]">
              {[
                { label: 'Total Orders', val: ordersHistory.length, icon: 'package' as const, color: '#60a5fa' },
                { label: 'In Cart', val: cartItems.length, icon: 'shopping-cart' as const, color: '#fbbf24' },
                { label: 'Favorites', val: likedProducts.length, icon: 'heart' as const, color: '#f87171' },
              ].map((s, i) => (
                <View key={i} className="flex-1 items-center">
                  <Feather name={s.icon} size={14} color={s.color} style={{ marginBottom: 6, opacity: 0.8 }} />
                  <Text className="text-white text-base font-black">{s.val}</Text>
                  <Text className="text-white/25 text-[8px] font-bold uppercase tracking-tight mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ==================== QUICK ACTIONS ==================== */}
          <View className="mx-5 mb-5 flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleCall(client.phone?.toString() || '')}
              className="flex-1 bg-white h-14 rounded-2xl flex-row items-center justify-center border border-gray-100/60"
            >
              <Feather name="phone" size={15} color="#1a1a1a" />
              <Text className="text-[11px] font-bold text-black ml-2.5 uppercase tracking-wider">Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleWhatsApp(client.phone?.toString() || '')}
              className="flex-1 bg-[#25D366] h-14 rounded-2xl flex-row items-center justify-center"
            >
              <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
              <Text className="text-[11px] font-bold text-white ml-2 uppercase tracking-wider">WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* ==================== IDENTITY CARD ==================== */}
          {isEditing && (
            <View className="mx-5 mb-5 bg-white rounded-2xl p-6 border border-gray-100/60">
              <View className="flex-row items-center mb-6">
                <View className="w-1 h-5 bg-black rounded-full mr-3" />
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">
                  Edit Details
                </Text>
              </View>

              {[
                { label: 'Full Name', key: 'fullName', icon: 'user' as const },
                { label: 'Phone', key: 'phone', icon: 'phone' as const, kb: 'phone-pad' },
                { label: 'Email', key: 'email', icon: 'mail' as const, kb: 'email-address' },
                { label: 'Address', key: 'address', icon: 'map-pin' as const },
              ].map((item, idx) => {
                const isPhone = item.key === 'phone';
                const isEmail = item.key === 'email';
                const value = String(formData[item.key] || '');

                const isInvalidEmail = isEmail && value && !isValidEmail(value);
                const isInvalidPhone = isPhone && value && !isValidPhone(value);
                const isInvalid = isInvalidEmail || isInvalidPhone;

                return (
                  <View key={idx} className="mb-4 last:mb-0">
                    <Text className={`text-[9px] font-bold uppercase tracking-[1.5px] mb-2 ml-1 ${isInvalid ? 'text-red-400' : 'text-gray-300'}`}>
                      {item.label}
                    </Text>
                    <View className={`flex-row items-center bg-gray-50/80 rounded-xl px-4 h-12 ${isInvalid ? 'border border-red-200' : ''}`}>
                      <Feather
                        name={item.icon}
                        size={14}
                        color={isInvalid ? "#ef4444" : "#D1D5DB"}
                      />
                      <TextInput
                        className="flex-1 ml-3 text-[13px] font-medium text-black"
                        value={value}
                        onChangeText={(t) => {
                          let val = t;
                          if (isPhone) {
                            val = t.replace(/\D/g, '').slice(0, 8);
                          }
                          setFormData({ ...formData, [item.key]: val });
                        }}
                        keyboardType={item.kb as any || 'default'}
                        maxLength={isPhone ? 8 : undefined}
                        placeholderTextColor="#D1D5DB"
                        placeholder={`Enter ${item.label.toLowerCase()}`}
                      />
                    </View>
                    {isEditing && isInvalidEmail && (
                      <Text className="text-[9px] text-red-400 font-medium mt-1 ml-1">Invalid email format</Text>
                    )}
                    {isEditing && isInvalidPhone && (
                      <Text className="text-[9px] text-red-400 font-medium mt-1 ml-1">Must be exactly 8 digits</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ==================== BEHAVIORAL ANALYSIS ==================== */}
          <View className="mx-5 mb-5 flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowCartModal(true)}
              className="flex-1 bg-white p-5 rounded-2xl border border-gray-100/60 items-center"
            >
              <View className="w-11 h-11 bg-amber-50 rounded-xl items-center justify-center mb-3">
                <Feather name="shopping-cart" size={18} color="#d97706" />
              </View>
              <Text className="text-lg font-black text-black">{cartItems.length}</Text>
              <Text className="text-[9px] font-medium uppercase text-gray-300 tracking-wider mt-0.5">Cart Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLikesModal(true)}
              className="flex-1 bg-white p-5 rounded-2xl border border-gray-100/60 items-center"
            >
              <View className="w-11 h-11 bg-rose-50 rounded-xl items-center justify-center mb-3">
                <Feather name="heart" size={18} color="#e11d48" />
              </View>
              <Text className="text-lg font-black text-black">{likedProducts.length}</Text>
              <Text className="text-[9px] font-medium uppercase text-gray-300 tracking-wider mt-0.5">Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowOrdersModal(true)}
              className="flex-1 bg-white p-5 rounded-2xl border border-gray-100/60 items-center"
            >
              <View className="w-11 h-11 bg-blue-50 rounded-xl items-center justify-center mb-3">
                <Feather name="package" size={18} color="#2563eb" />
              </View>
              <Text className="text-lg font-black text-black">{ordersHistory.length}</Text>
              <Text className="text-[9px] font-medium uppercase text-gray-300 tracking-wider mt-0.5">Orders</Text>
            </TouchableOpacity>
          </View>

          {/* ==================== ORDER HISTORY ==================== */}
          <View className="mx-5 mb-5 bg-white rounded-2xl border border-gray-100/60 overflow-hidden">
            <View className="flex-row justify-between items-center px-6 pt-5 pb-4">
              <View className="flex-row items-center">
                <View className="w-1 h-5 bg-black rounded-full mr-3" />
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">
                  Recent Orders
                </Text>
              </View>
              {ordersHistory.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowOrdersModal(true)}
                  className="bg-gray-50 px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-[10px] font-bold text-gray-500">View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {ordersHistory.length > 0 ? (
              ordersHistory.slice(0, 3).map((order, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedOrder(order);
                    setIsOrderModalVisible(true);
                  }}
                  className="flex-row items-center justify-between px-6 py-4 border-t border-gray-50"
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${order.status === 'delivered' ? 'bg-emerald-50' : order.status === 'pending' ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                      <Feather
                        name={order.status === 'delivered' ? 'check-circle' : order.status === 'pending' ? 'clock' : 'x-circle'}
                        size={14}
                        color={order.status === 'delivered' ? '#059669' : order.status === 'pending' ? '#d97706' : '#ef4444'}
                      />
                    </View>
                    <View>
                      <Text className="text-[13px] font-bold text-black">
                        Order #{order.orderNumber}
                      </Text>
                      <Text className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {order.updatedAt ? timeAgo(order.updatedAt) : order.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-[13px] font-bold text-black mr-2">
                      {((calcTotalPrice(order) || 0) + (order.shippingCoast || 0)).toFixed(0)} DT
                    </Text>
                    <Feather name="chevron-right" size={14} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="py-12 items-center border-t border-gray-50">
                <Text className="text-[11px] text-gray-300 font-medium">No orders yet</Text>
              </View>
            )}
          </View>

          {/* ==================== AI INTELLIGENCE CARD ==================== */}
          <View className="mx-5 mb-5">
            <TouchableOpacity
              onPress={() => setShowSummary(true)}
              activeOpacity={0.9}
              className="bg-black rounded-2xl p-6 overflow-hidden"
            >
              <View className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -mr-16 -mt-16" />

              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View className="bg-white/10 w-9 h-9 rounded-xl items-center justify-center mr-3">
                    <MaterialCommunityIcons name="brain" size={16} color="white" />
                  </View>
                  <Text className="text-white font-bold text-[11px] uppercase tracking-[1.5px]">
                    AI Briefing
                  </Text>
                </View>
                <View className={`w-2 h-2 rounded-full ${chatHistory[0]?.summary ? 'bg-emerald-400' : 'bg-white/20'}`} />
              </View>

              <Text
                className="text-white/50 text-[12px] leading-5 mb-5"
                numberOfLines={2}
              >
                {chatHistory[0]?.summary?.replace(/\*+/g, '') ||
                  'No AI intelligence collected yet. Interactions will build a behavioral profile.'}
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowTranscript(true)}
                  className="flex-1 bg-white/[0.08] h-11 rounded-xl items-center justify-center"
                >
                  {fetchingChat ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white/70 font-bold text-[10px] uppercase tracking-wider">
                      Chat Logs
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowSummary(true)}
                  className="flex-1 bg-white h-11 rounded-xl items-center justify-center"
                >
                  <Text className="text-black font-bold text-[10px] uppercase tracking-wider">
                    Full Brief
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== MODALS ==================== */}

      {/* AI Summary Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSummary}
        onRequestClose={() => setShowSummary(false)}
      >
        <View className="flex-1 bg-black/70 justify-center px-5">
          <View
            style={{ backgroundColor: '#FAFAFA' }}
            className="rounded-2xl p-7 max-h-[75%]"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300 mb-1">
                  Intelligence
                </Text>
                <Text className="text-xl font-black text-black">AI Briefing</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSummary(false)}
                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              >
                <Feather name="x" size={16} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {chatHistory[0]?.summary ? (
                chatHistory[0].summary
                  .split('\n')
                  .map((line: string, i: number) => (
                    <Text
                      key={i}
                      className="text-gray-500 text-[13px] leading-6 mb-2.5"
                    >
                      {line.replace(/\*+/g, '').trim()}
                    </Text>
                  ))
              ) : (
                <View className="py-16 items-center justify-center">
                  <View className="w-14 h-14 bg-gray-100 rounded-2xl items-center justify-center mb-5">
                    <MaterialCommunityIcons name="brain" size={24} color={colors.dark[100]} style={{ opacity: 0.15 }} />
                  </View>
                  <Text className="text-center text-gray-300 text-[11px] font-medium px-8 leading-5">
                    The AI hasn't collected enough data to generate a behavioral summary for this client yet.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Live Transcript Modal */}
      <LiveChatModal
        showTranscript={showTranscript}
        setShowTranscript={setShowTranscript}
        chatHistory={chatHistory}
      />

      {/* Cart Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCartModal}
        onRequestClose={() => setShowCartModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ backgroundColor: '#FAFAFA' }}
            className="rounded-t-2xl h-[70%] p-6"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300 mb-1">
                  Active Interest
                </Text>
                <Text className="text-xl font-black text-black">Cart Items</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCartModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              >
                <Feather name="x" size={16} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            {renderProductList(cartItems, 'The client cart is empty', true)}
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLikesModal}
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ backgroundColor: '#FAFAFA' }}
            className="rounded-t-2xl h-[70%] p-6"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300 mb-1">
                  Saved Items
                </Text>
                <Text className="text-xl font-black text-black">Favorites</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLikesModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              >
                <Feather name="x" size={16} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            {renderProductList(likedProducts, 'No saved items in Favorites')}
          </View>
        </View>
      </Modal>

      {/* Orders Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showOrdersModal}
        onRequestClose={() => setShowOrdersModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ backgroundColor: '#FAFAFA' }}
            className="rounded-t-2xl h-[75%] p-6"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300 mb-1">
                  Full History
                </Text>
                <Text className="text-xl font-black text-black">All Orders</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOrdersModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              >
                <Feather name="x" size={16} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {ordersHistory.length > 0 ? (
                ordersHistory.map((order, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedOrder(order);
                      setIsOrderModalVisible(true);
                    }}
                    className="flex-row items-center justify-between p-4 mb-3 bg-white rounded-2xl border border-gray-100/60"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3 ${order.status === 'delivered' ? 'bg-emerald-50' : order.status === 'pending' ? 'bg-amber-50' : 'bg-red-50'
                        }`}>
                        <Feather
                          name={order.status === 'delivered' ? 'check-circle' : order.status === 'pending' ? 'clock' : 'x-circle'}
                          size={15}
                          color={order.status === 'delivered' ? '#059669' : order.status === 'pending' ? '#d97706' : '#ef4444'}
                        />
                      </View>
                      <View>
                        <Text className="text-[13px] font-bold text-black">
                          Order #{order.orderNumber}
                        </Text>
                        <Text className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {order.updatedAt ? timeAgo(order.updatedAt) : order.status}
                        </Text>
                      </View>
                    </View>
                    <View className='flex-row items-center'>
                      <Text className="text-[13px] font-bold text-black mr-2">
                        {((calcTotalPrice(order) || 0) + (order.shippingCoast || 0)).toFixed(0)} DT
                      </Text>
                      <Feather name="chevron-right" size={14} color="#D1D5DB" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-16 items-center justify-center">
                  <View className="w-14 h-14 bg-gray-100 rounded-2xl items-center justify-center mb-5">
                    <Feather name="package" size={22} color={colors.dark[100]} style={{ opacity: 0.15 }} />
                  </View>
                  <Text className="text-center text-gray-300 text-[11px] font-medium px-8 leading-5">
                    No orders recorded for this client.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OrderDetailsModal
        isVisible={isOrderModalVisible}
        onClose={() => setIsOrderModalVisible(false)}
        order={selectedOrder}
        deliveryWorker={deliveryWorker}
        onUpdateSuccess={() => {
          // refresh orders if needed (optional since we're just viewing)
        }}
      />
    </View>
  );
};

export default ClientDetails;
