import { colors } from '@/constants';
import Header from '@/components/main/header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react'; // أضفنا useCallback
import { FlatList, Text, View, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView, Image, Linking, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { backEndUrl } from '@/api';
import OrderDetailsModal from '../screens/orderDetailsModal';
import { OrderType } from '@/types';
import moment from 'moment';

type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  linkInfo?: string;
  client?: any;
  product?: any;
  productId?: string;
  clientId?: string;
  actionDetails?: any;
};

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // حالة التحديث الجديدة
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [deliveryWorker, setDeliveryWorker] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchNotifications(true);
    markAsRead();
    fetchDeliveryWorker();
  }, []);

  const fetchDeliveryWorker = async () => {
    try {
      const { data } = await axios.get(`${backEndUrl}/getDeliveryWorker`);
      if (data.deliveryWorker) {
        setDeliveryWorker(data.deliveryWorker);
      }
    } catch (error) {
      console.log('Error fetching delivery worker:', error);
    }
  };

  const fetchNotifications = async (isFirstLoad = false, isRefreshing = false) => {
    if (isFirstLoad) {
      if (!isRefreshing) setLoading(true);
    } else {
      if (!hasMore || loadingMore || refreshing) return;
      setLoadingMore(true);
    }

    try {
      // إذا كنا نقوم بالتحديث، نبدأ من الصفر (skip = 0)
      const skip = isFirstLoad ? 0 : notifications.length;
      const { data } = await axios.get(`${backEndUrl}/getNotifications?skip=${skip}&limit=${limit}`);

      if (data.success) {
        if (isFirstLoad) {
          setNotifications(data.notifications);
          setHasMore(data.notifications.length === limit); // إعادة تعيينhasMore عند التحديث
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
          if (data.notifications.length < limit) {
            setHasMore(false);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false); // إيقاف مؤشر التحديث
    }
  };

  // دالة التحديث عند السحب
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true); // إعادة تفعيل التحميل اللانهائي
    fetchNotifications(true, true);
    fetchDeliveryWorker();
  }, []);

  const markAsRead = async () => {
    try {
      await axios.put(`${backEndUrl}/markNotificationsAsRead`);
    } catch (error) {
      console.log('Error marking notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return { name: 'package-variant-closed', color: '#10b981' }; // Emerald
      case 'add_to_cart':
        return { name: 'cart-plus', color: '#3b82f6' }; // Blue
      case 'remove_from_cart':
        return { name: 'cart-remove', color: '#ef4444' }; // Red
      case 'like':
        return { name: 'heart', color: '#f43f5e' }; // Rose
      case 'unlike':
        return { name: 'heart-broken', color: '#94a3b8' }; // Slate
      case 'rate':
        return { name: 'star', color: '#f59e0b' }; // Amber
      case 'rate_update':
        return { name: 'star-circle', color: '#f59e0b' }; // Amber
      case 'rate_delete':
        return { name: 'star-off', color: '#94a3b8' }; // Slate
      case 'new_client':
        return { name: 'account-plus', color: '#8b5cf6' }; // Violet
      default:
        return { name: 'bell-outline', color: colors.dark[200] };
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.linkInfo) return;

    if (item.type === 'new_order') {
      try {
        setLoading(true);
        const { data } = await axios.get(`${backEndUrl}/getOrderById?orderId=${item.linkInfo}`);
        if (data.success) {
          setSelectedOrder(data.order);
          setIsModalVisible(true);
        }
      } catch (error) {
        console.log('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For other types (cart, likes, rate, new client), open targeted detail modal INSTANTLY
    setSelectedNotification(item);
    setClientModalVisible(true);

    // If it's an old notification (missing client or product references), smartly fetch ONLY what we need
    if ((!item.client || !item.product) && item.linkInfo) {
      setLoadingIntelligence(true);
      try {
        const updates: any = {};

        // 1. Fetch lightweight client basics if missing
        if (!item.client) {
          const clientRes = await axios.get(`${backEndUrl}/getClientById?id=${item.linkInfo}`);
          if (clientRes.data.client) updates.client = clientRes.data.client;
        }

        // 2. Fetch specific product connection if missing, hitting ONLY the required endpoint
        if (!item.product) {
          if (item.type === 'add_to_cart' || item.type === 'remove_from_cart') {
            // In Wassim's backend, getCartByClient gets the cart container, but getting the actual
            // items in cart natively uses a different path. Let's gracefully just grab the latest 
            // client interaction using the broader getClientInfoById IF and ONLY IF we really need to find the product
            // Actually, since getClientInfoById was too slow, we'll gracefully fallback and NOT block the UI, 
            // accepting that very old notifications might just say "Product" without an image.
            // We can do a quick check on the client's single most likely recent action if endpoints existed,
            // but since they don't natively exist for singular fetching easily, we skip this aggressive query.
            // (New notifications already have the exact product embedded anyway).
          }
        }

        if (Object.keys(updates).length > 0) {
          setSelectedNotification((prev: any) => prev ? { ...prev, ...updates } : null);
        }

      } catch (error) {
        console.log('Error fetching missing detail:', error);
      } finally {
        setLoadingIntelligence(false);
      }
    } else {
      setLoadingIntelligence(false);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconData = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
        className={`px-5 py-4 border-b border-gray-100 flex-row items-start ${!item.isRead ? 'bg-red-50/10' : ''}`}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${iconData.color}15` }}
        >
          <MaterialCommunityIcons name={iconData.name as any} size={20} color={iconData.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <Text className="font-semibold text-[14px] flex-1 text-dark-100" numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && (
              <View className="w-2 h-2 rounded-full bg-red-500 ml-2 mt-1.5" />
            )}
          </View>
          <Text className="text-sm mt-0.5 opacity-70 leading-5 text-dark-200" numberOfLines={2}>
            {item.body}
          </Text>
          <Text className="text-[10px] mt-2 font-bold opacity-40 text-dark-200">
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.light[100] }}>
      <Header
        title="Notifications"
        onBackButtonPress={() => router.back()}
      />

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.dark[100]} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => fetchNotifications()}
          onEndReachedThreshold={0.5}
          // إضافة مكون RefreshControl هنا
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.dark[100]]} // للأندرويد
              tintColor={colors.dark[100]} // للـ iOS
            />
          }
          ListFooterComponent={() => loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.dark[100]} />
            </View>
          ) : null}
          ListEmptyComponent={() => (
            <View className="py-16 items-center justify-center px-6 mt-10">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.light[300] }}
              >
                <MaterialCommunityIcons name="bell-outline" size={40} color={colors.light[600]} />
              </View>
              <Text className="text-lg font-bold text-center" style={{ color: colors.dark[100] }}>
                No notifications yet
              </Text>
              <Text className="text-sm text-center mt-2 opacity-70" style={{ color: colors.dark[200] }}>
                New updates and alerts will appear here.
              </Text>
            </View>
          )}
        />
      )}

      <OrderDetailsModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        order={selectedOrder}
        deliveryWorker={deliveryWorker}
        onUpdateSuccess={() => { }}
      />

      {/* Targeted Notification Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={clientModalVisible}
        onRequestClose={() => setClientModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setClientModalVisible(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableWithoutFeedback>
            <View style={{ height: '75%', backgroundColor: colors.light[100] }} className="rounded-t-[40px] shadow-2xl p-6">
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-6" />
                <View className="flex-row items-center justify-between w-full">
                  <Text className="text-xl font-black text-black">Notification Details</Text>
                </View>
              </View>

              {/* Render Main Content Immediately */}
              {selectedNotification ? (
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

                  {/* 1. Action Details */}
                  <View className="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">What Happened</Text>

                    <View className="flex-row items-center mb-2">
                      <MaterialCommunityIcons
                        name={getNotificationIcon(selectedNotification.type).name as any}
                        size={20}
                        color={getNotificationIcon(selectedNotification.type).color}
                      />
                      <Text className="text-sm font-bold text-black ml-2 flex-1">{selectedNotification.title}</Text>
                    </View>

                    <Text className="text-sm text-gray-600 leading-5 mb-4">{selectedNotification.body}</Text>

                    {selectedNotification.actionDetails?.rating && (
                      <View className="flex-row items-center mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <MaterialCommunityIcons
                            key={star}
                            name={star <= selectedNotification.actionDetails.rating ? 'star' : 'star-outline'}
                            size={18}
                            color={star <= selectedNotification.actionDetails.rating ? '#f59e0b' : '#e5e7eb'}
                          />
                        ))}
                      </View>
                    )}
                    {selectedNotification.actionDetails?.comment && (
                      <View className="bg-white p-3 rounded-xl border border-gray-100 mb-3">
                        <Text className="text-xs text-gray-600 italic">"{selectedNotification.actionDetails.comment}"</Text>
                      </View>
                    )}
                    {selectedNotification.actionDetails?.quantity && (
                      <Text className="text-xs text-emerald-600 font-bold mb-3">
                        Added: {selectedNotification.actionDetails.quantity} unit(s)
                        {selectedNotification.actionDetails.spec?.size ? ` • Size: ${selectedNotification.actionDetails.spec.size}` : ''}
                        {selectedNotification.actionDetails.spec?.color ? ` • Color: ${selectedNotification.actionDetails.spec.color}` : ''}
                      </Text>
                    )}

                    <Text className="text-[11px] text-gray-400 font-bold">{moment(selectedNotification.createdAt).format('dddd, MMMM Do YYYY, h:mm a')}</Text>
                  </View>

                  {/* 2. Client Details */}
                  {selectedNotification.client ? (
                    <View className="mb-6">
                      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">The Customer</Text>
                      <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center justify-between">
                        <TouchableOpacity
                          className="flex-row items-center flex-1"
                          onPress={() => {
                            setClientModalVisible(false);
                            router.push({ pathname: '/screens/clientDetails/[id]', params: { id: selectedNotification.client._id || selectedNotification.linkInfo } });
                          }}
                        >
                          <View className="w-12 h-12 bg-black rounded-full items-center justify-center mr-4">
                            {selectedNotification.client.fullName ? (
                              <Text className="text-xl font-bold text-white uppercase">
                                {selectedNotification.client.fullName.charAt(0)}
                              </Text>
                            ) : (
                              <MaterialCommunityIcons name="account" size={22} color="white" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-black" numberOfLines={1}>{selectedNotification.client.fullName || 'Unknown'}</Text>
                            <Text className="text-[11px] text-gray-500 mt-1">{selectedNotification.client.phone || selectedNotification.client.email || 'No contact info'}</Text>
                          </View>
                        </TouchableOpacity>

                        {!!selectedNotification.client.phone && (
                          <TouchableOpacity
                            className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center border border-emerald-100"
                            onPress={() => Linking.openURL(`tel:${selectedNotification.client.phone}`)}
                          >
                            <MaterialCommunityIcons name="phone" size={18} color="#10b981" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ) : loadingIntelligence ? (
                    <View className="mb-6 p-4 items-center justify-center">
                      <ActivityIndicator size="small" color="#E5E7EB" />
                    </View>
                  ) : null}

                  {/* 3. Product Details */}
                  {selectedNotification.product || selectedNotification.productId ? (
                    <View className="mb-8">
                      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">The Product</Text>
                      <TouchableOpacity
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center"
                        onPress={() => {
                          const pId = selectedNotification.product?._id || selectedNotification.productId;
                          if (!pId) return;

                          setClientModalVisible(false);
                          router.push({ pathname: '/screens/productDetails/[id]', params: { id: pId } });
                        }}
                      >
                        {selectedNotification.product?.thumbNail ? (
                          <Image source={{ uri: selectedNotification.product.thumbNail }} className="w-14 h-14 rounded-xl bg-gray-50" />
                        ) : (
                          <View className="w-14 h-14 rounded-xl bg-red-50 items-center justify-center">
                            <MaterialCommunityIcons name="package-variant-remove" size={24} color="#ef4444" />
                          </View>
                        )}
                        <View className="flex-1 ml-4 justify-center">
                          <Text className={`text-sm font-bold ${!selectedNotification.product ? 'text-red-500 italic' : 'text-black'}`} numberOfLines={2}>
                            {selectedNotification.product ? (selectedNotification.product.name?.en || selectedNotification.product.name?.fr || 'Product') : 'Deleted Product'}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Text className={`text-[11px] font-black ${!selectedNotification.product ? 'text-red-600' : 'text-emerald-600'}`}>
                              {selectedNotification.product ? 'View Details' : 'See Deleted Message'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={14} color={!selectedNotification.product ? "#ef4444" : "#10b981"} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : loadingIntelligence ? (
                    <View className="mb-8 p-4 items-center justify-center">
                      <ActivityIndicator size="small" color="#E5E7EB" />
                    </View>
                  ) : null}

                </ScrollView>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView >
  );
};

export default NotificationsScreen;