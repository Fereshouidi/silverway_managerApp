import { backEndUrl } from '@/api';
import LiveChatModal from '@/components/main/liveChatModal';
import { colors } from '@/constants';
import { useStatusBanner } from '@/contexts/StatusBanner';
import { calcTotalPrice, handleCall, handleWhatsApp, isValidEmail, isValidPhone } from '@/lib';
import { ProductType, OrderType, DeliveryWorkerType } from '@/types';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import OrderDetailsModal from '@/app/screens/orderDetailsModal';
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
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import Markdown, { ASTNode } from 'react-native-markdown-display';

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
              className="flex-row items-center mb-5 bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm"
            >
              {/* Image Container */}
              <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mr-5 shadow-inner overflow-hidden border border-gray-100/50">
                {productImage ? (
                  <Image
                    source={{ uri: productImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={28}
                    color={colors.dark[100]}
                    style={{ opacity: 0.1 }}
                  />
                )}
              </View>

              {/* Info Section */}
              <View className="flex-1 justify-center">
                <Text className="text-[13px] font-black text-black mb-1" numberOfLines={1}>
                  {typeof item.name === 'object'
                    ? (item.name?.en || item.name?.fr || 'Unknown Product')
                    : (item.name || 'Unknown Product')}
                </Text>
                {isCart && entry.specification ? (
                  <View className="flex-row items-center bg-emerald-50 self-start px-2 py-0.5 rounded-full border border-emerald-100/50">
                    <Text className="text-[8px] text-emerald-700 font-black uppercase tracking-tighter">
                      {entry.specification.color || 'STNDRD'} / {entry.specification.size || 'UNISZ'} × {entry.quantity || 1}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Official Item
                  </Text>
                )}
              </View>

              {/* Price & Actions */}
              <View className="items-end ml-4">
                <Text className="text-sm font-black text-black mb-1.5">
                  {item.price ?? 0} DT
                </Text>

                {isCart && purchaseId ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePurchase(purchaseId);
                    }}
                    className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-xl border border-red-100"
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={12} color="#EF4444" />
                    <Text className="text-[8.5px] font-black text-red-500 uppercase ml-1 tracking-tight">Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                    <Feather name="chevron-right" size={16} color="#D1D5DB" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View className="py-20 items-center justify-center">
          <View className="w-20 h-20 bg-gray-50 rounded-[35px] items-center justify-center mb-6 border border-gray-100">
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={32}
              color={colors.dark[100]}
              style={{ opacity: 0.05 }}
            />
          </View>
          <Text className="text-[10px] text-black font-black uppercase tracking-[3px] opacity-20 text-center px-10 leading-4">
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

  if (fetching || !client) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.light[100] }}
      >
        <ActivityIndicator color={colors.dark[100]} size="large" />
        <Text className="mt-4 text-[10px] font-black opacity-30 uppercase tracking-[4px]">
          Analysing Dossier
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.light[100] }}>
      <StatusBar barStyle="dark-content" />

      {/* ==================== MODERN HEADER (v2 style) ==================== */}
      <View className="px-6 pt-14 pb-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.dark[100]} />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
            Dossier Profile
          </Text>
          <Text className="text-lg font-black text-black">
            {isEditing ? 'Editor Mode' : client.fullName}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={`w-12 h-12 rounded-2xl items-center justify-center shadow-sm ${isEditing ? 'bg-black' : 'bg-gray-50 border border-gray-100'
            }`}
        >
          <MaterialCommunityIcons
            name={
              loading
                ? 'dots-horizontal'
                : isEditing
                  ? 'check-all'
                  : 'account-edit-outline'
            }
            size={22}
            color={isEditing ? 'white' : colors.dark[100]}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ==================== PREMIUM HEADER STATS ==================== */}
          <View className="mx-6 mt-6 bg-black rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <View className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />

            <View className="mb-8">
              <Text className="text-white/40 text-[10px] font-black uppercase tracking-[3px] mb-4">Lifetime Value</Text>
              <View className="flex-row items-baseline">
                <Text className="text-white text-4xl font-black">
                  {ordersHistory.reduce((acc, order) => acc + (calcTotalPrice(order) || 0) + (order.shippingCoast || 0), 0).toFixed(2)} D.T
                </Text>
                <Text className="text-emerald-400 text-xs font-bold ml-2 uppercase tracking-widest">Revenue</Text>
              </View>
            </View>

            <View className="flex-row justify-between pt-6 border-t border-white/10">
              {[
                { label: 'Orders', val: ordersHistory.length, icon: 'package-variant-closed', color: '#60a5fa' },
                { label: 'In Cart', val: cartItems.length, icon: 'cart-outline', color: '#facc15' },
                { label: 'Wishlist', val: likedProducts.length, icon: 'heart-outline', color: '#f87171' },
              ].map((s, i) => (
                <View key={i} className="flex-1 items-center border-r border-white/5 last:border-0">
                  <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} style={{ marginBottom: 6 }} />
                  <Text className="text-white text-lg font-black">{s.val}</Text>
                  <Text className="text-white/30 text-[8px] font-bold uppercase tracking-tighter">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ==================== IDENTITY CARD (v2 beautiful style) ==================== */}
          <View className="mx-6 mt-6 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-8">
              <View className="w-1.5 h-6 bg-black rounded-full mr-3" />
              <Text className="text-sm font-black uppercase tracking-widest text-black">
                Identity Information
              </Text>
            </View>

            {[
              { label: 'Legal Name', key: 'fullName', icon: 'account-outline' },
              { label: 'Direct Line', key: 'phone', icon: 'phone-outline', kb: 'phone-pad' },
              { label: 'Digital Mail', key: 'email', icon: 'at', kb: 'email-address' },
              { label: 'Geography', key: 'address', icon: 'map-marker-outline' },
            ].map((item, idx) => {
              const isPhone = item.key === 'phone';
              const isEmail = item.key === 'email';
              const value = String(formData[item.key] || '');

              const isInvalidEmail = isEmail && value && !isValidEmail(value);
              const isInvalidPhone = isPhone && value && !isValidPhone(value);
              const isInvalid = isInvalidEmail || isInvalidPhone;

              return (
                <View key={idx} className="mb-8 last:mb-0">
                  <Text className={`text-[9px] font-black uppercase tracking-[2px] mb-2 ml-1 ${isInvalid ? 'text-red-500' : 'text-black/20'}`}>
                    {item.label}
                  </Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-2xl p-4 border ${isInvalid ? 'border-red-500' : 'border-gray-100/50'}`}>
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={18}
                      color={isInvalid ? "#ef4444" : colors.dark[100]}
                      style={{ opacity: isInvalid ? 1 : 0.4 }}
                    />
                    {isEditing ? (
                      <TextInput
                        className="flex-1 ml-4 text-sm font-bold text-black"
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
                      />
                    ) : (
                      <Text className="flex-1 ml-4 text-sm font-bold text-black">
                        {client[item.key] || 'Not Provided'}
                      </Text>
                    )}
                  </View>
                  {isEditing && isInvalidEmail && (
                    <Text className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase">Invalid email format</Text>
                  )}
                  {isEditing && isInvalidPhone && (
                    <Text className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase">Must be exactly 8 digits</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* ==================== BEHAVIORAL ANALYSIS (Cart + Likes) ==================== */}
          <View className="px-6 mt-8">
            <Text className="text-[11px] font-black text-black/20 uppercase tracking-[3px] mb-4 ml-2">
              Marketplace Interest
            </Text>
            <View className="flex-row gap-4 mb-8">
              <TouchableOpacity
                onPress={() => {
                  // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCartModal(true);
                }}
                className="flex-1 bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm items-center"
              >
                <View className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center mb-3">
                  <MaterialCommunityIcons name="shopping-outline" size={24} color="black" />
                </View>
                <Text className="text-lg font-black">{cartItems.length}</Text>
                <Text className="text-[8px] font-bold uppercase opacity-40">Cart Objects</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowLikesModal(true);
                }}
                className="flex-1 bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm items-center"
              >
                <View className="w-12 h-12 bg-rose-50 rounded-full items-center justify-center mb-3">
                  <MaterialCommunityIcons name="heart-pulse" size={24} color="#f43f5e" />
                </View>
                <Text className="text-lg font-black">{likedProducts.length}</Text>
                <Text className="text-[8px] font-bold uppercase opacity-40">Wishlist</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ==================== ORDER HISTORY (restored + modern card) ==================== */}
          <View className="mx-6 mb-8 bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-[11px] font-black text-black/20 uppercase tracking-[2px]">
                Recent Orders
              </Text>
              {ordersHistory.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowOrdersModal(true)}
                  className="px-3 py-1"
                >
                  <Text className="text-[10px] font-bold text-black">View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {ordersHistory.length > 0 ? (
              ordersHistory.slice(0, 5).map((order, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedOrder(order);
                    setIsOrderModalVisible(true);
                  }}
                  className="flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0"
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-2 h-2 rounded-full mr-3 ${order.status === 'delivered' ? 'bg-emerald-500' : order.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                    />
                    <View>
                      <Text className="text-xs font-black text-black">
                        Order #{order.orderNumber}
                      </Text>
                      <Text className="text-[9px] text-black/40 font-bold uppercase">
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <View className='flex-row items-center'>
                    <Text className="text-xs font-black text-emerald-600 mr-2">
                      {(calcTotalPrice(order) || 0) + (order.shippingCoast || 0)} D.T
                    </Text>
                    <Feather name="chevron-right" size={14} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-xs text-black/30 text-center py-4">No transactions found.</Text>
            )}
          </View>

          {/* ==================== AI INTELLIGENCE CARD (premium dark style) ==================== */}
          <View className="mx-6 mb-8">
            <TouchableOpacity
              onPress={() => setShowSummary(true)}
              activeOpacity={0.9}
              className="bg-black rounded-[40px] p-8 shadow-2xl"
            >
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-row items-center">
                  <View className="bg-white/10 p-2.5 rounded-2xl mr-3">
                    <MaterialCommunityIcons name="brain" size={20} color="white" />
                  </View>
                  <Text className="text-white font-black text-xs uppercase tracking-[2px]">
                    AI Briefing
                  </Text>
                </View>
                <View className="bg-emerald-500 w-2 h-2 rounded-full shadow-[0_0_10px_#10b981]" />
              </View>

              <Text
                className="text-white/70 text-xs leading-6 italic mb-6"
                numberOfLines={3}
              >
                {chatHistory[0]?.summary?.replace(/\*+/g, '') ||
                  'Awaiting intelligence collection from future interactions...'}
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowTranscript(true)}
                  className="flex-1 bg-white/10 h-14 rounded-2xl items-center justify-center border border-white/5"
                >
                  {fetchingChat ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                      Live Logs
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowSummary(true)}
                  className="flex-1 bg-emerald-500 h-14 rounded-2xl items-center justify-center"
                >
                  <Text className="text-black font-black text-[10px] uppercase tracking-widest">
                    Full Brief
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== FLOATING BOTTOM ACTIONS (v2 style) ==================== */}
      {!isEditing && (
        <View className="absolute bottom-10 left-6 right-6 flex-row gap-4 h-20 items-center px-4 bg-white/80 rounded-[35px] border border-white/20 shadow-2xl backdrop-blur-md">
          <TouchableOpacity
            className="flex-1 h-14 bg-black rounded-2xl flex-row items-center justify-center"
            onPress={() => handleCall(client.phone?.toString() || '')}
          >
            <MaterialCommunityIcons name="phone" size={18} color="white" />
            <Text className="text-white font-black ml-3 uppercase text-[10px] tracking-widest">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-14 h-14 bg-emerald-500 rounded-2xl items-center justify-center shadow-lg"
            onPress={() => handleWhatsApp(client.phone?.toString() || '')}
          >
            <MaterialCommunityIcons name="whatsapp" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* ==================== MODALS (kept from v1 + modern rounded styling) ==================== */}

      {/* AI Summary Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSummary}
        onRequestClose={() => setShowSummary(false)}
      >
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View
            style={{ backgroundColor: colors.light[100] }}
            className="rounded-[24px] p-8 max-h-[70%] shadow-2xl"
          >
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
                  Intelligence
                </Text>
                <Text className="text-xl font-black text-black">Briefing</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSummary(false)}
                className="w-10 h-10 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.dark[100]} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {chatHistory[0]?.summary ? (
                chatHistory[0].summary
                  .split('\n')
                  .map((line: string, i: number) => (
                    <Text
                      key={i}
                      className="text-gray-600 text-[14px] leading-6 mb-3"
                    >
                      {line.replace(/\*+/g, '').trim()}
                    </Text>
                  ))
              ) : (
                <View className="py-20 items-center justify-center">
                  <View className="w-16 h-16 bg-gray-50 rounded-3xl items-center justify-center mb-6">
                    <MaterialCommunityIcons name="brain" size={30} color={colors.dark[100]} style={{ opacity: 0.1 }} />
                  </View>
                  <Text className="text-center text-[10px] font-black text-black uppercase tracking-[2px] opacity-40 mb-2">
                    No dossier yet
                  </Text>
                  <Text className="text-center text-[11px] text-gray-400 font-bold px-6 leading-5">
                    The AI has not yet collected enough data to generate a behavioral summary for this client.
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
        <View className="flex-1 bg-black/80 justify-end">
          <View
            style={{ backgroundColor: colors.light[100] }}
            className="rounded-t-[24px] h-[70%] p-8"
          >
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
                  Active Interest
                </Text>
                <Text className="text-xl font-black text-black">Cart Items</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCartModal(false)}
                className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.dark[100]} />
              </TouchableOpacity>
            </View>
            {renderProductList(cartItems, 'The client selection is empty', true)}
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
        <View className="flex-1 bg-black/80 justify-end">
          <View
            style={{ backgroundColor: colors.light[100] }}
            className="rounded-t-[24px] h-[70%] p-8"
          >
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
                  Interest List
                </Text>
                <Text className="text-xl font-black text-black">Favorites</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLikesModal(false)}
                className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.dark[100]} />
              </TouchableOpacity>
            </View>
            {renderProductList(likedProducts, 'No saved items in wishlist')}
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
        <View className="flex-1 bg-black/80 justify-end">
          <View
            style={{ backgroundColor: colors.light[100] }}
            className="rounded-t-[24px] h-[70%] p-8"
          >
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
                  Ledger History
                </Text>
                <Text className="text-xl font-black text-black">Transaction Logs</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOrdersModal(false)}
                className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.dark[100]} />
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
                    className="flex-row items-center justify-between p-5 mb-4 bg-gray-50 rounded-[25px] border border-gray-100"
                  >
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-4 ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                      <View>
                        <Text className="text-sm font-black text-black">
                          Dossier #{order.orderNumber}
                        </Text>
                        <Text className="text-[10px] text-black/40 font-bold uppercase tracking-wider">
                          Status: {order.status}
                        </Text>
                      </View>
                    </View>
                    <View className='flex-row items-center'>
                      <Text className="text-xs font-black text-emerald-600 mr-3">
                        ${(calcTotalPrice(order) || 0) + (order.shippingCoast || 0)}
                      </Text>
                      <Feather name="chevron-right" size={16} color="#D1D5DB" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-20 items-center justify-center">
                  <View className="w-16 h-16 bg-gray-50 rounded-3xl items-center justify-center mb-6">
                    <MaterialCommunityIcons name="package-variant-closed" size={30} color={colors.dark[100]} style={{ opacity: 0.1 }} />
                  </View>
                  <Text className="text-center text-[10px] font-black text-black uppercase tracking-[2px] opacity-40 mb-2">
                    Clean Slate
                  </Text>
                  <Text className="text-center text-[11px] text-gray-400 font-bold px-6 leading-5">
                    There are no recorded transactions associated with this client profile.
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