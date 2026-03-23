import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, RefreshControl, Platform, ActivityIndicator, Image, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, ShoppingBag, DollarSign, Calendar, Wallet, ChevronRight } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ProfitsChartByDate from '@/components/sub/charts/profitsByDate';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderDetailsModal from '../screens/orderDetailsModal';
import { OrderType } from '@/types';

const { width } = Dimensions.get('window');

type TopProduct = {
  _id: string;
  name: string;
  image: string;
  totalSales: number;
  totalRevenue: number;
};

const Analytics = () => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [orderStats, setOrderStats] = useState({ total: 0, trend: '0.0' });
  const [salesStats, setSalesStats] = useState({ total: 0, trend: '0.0' });
  const [clientStats, setClientStats] = useState({ total: 0, trend: '0.0' });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState(new Date());
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  // All Products Modal states
  const [showAllModal, setShowAllModal] = useState(false);
  const [allProducts, setAllProducts] = useState<TopProduct[]>([]);
  const [allProductsSkip, setAllProductsSkip] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMetric, setLoadingMetric] = useState(false);
  const [loadingMoreMetric, setLoadingMoreMetric] = useState(false);
  const [metricSkip, setMetricSkip] = useState(0);
  const [metricHasMore, setMetricHasMore] = useState(true);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{ title: string; data: any[] } | null>(null);
  const [storeLaunchDate, setStoreLaunchDate] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<'week' | '2weeks' | 'month' | 'year' | 'all' | 'custom'>('week');
  const router = useRouter();

  const fetchAnalyticsData = async () => {
    // لا نضع setLoading(true) إذا كنا في حالة refreshing لمنع تداخل المؤشرات
    if (!refreshing) setLoading(true);
    try {
      const params = { from: dateFrom.getTime(), to: dateTo.getTime() };

      const [ordersRes, salesRes, clientsRes, topProductsRes] = await Promise.all([
        axios.get(`${backEndUrl}/getOrdersCountByDateRange`, { params }),
        axios.get(`${backEndUrl}/getTotalSalesByDateRange`, { params }),
        axios.get(`${backEndUrl}/getNewClientsCountByDateRange`, { params }),
        axios.get(`${backEndUrl}/getBestSellers`, { params: { ...params, limit: 3, status: JSON.stringify(["active", "archived"]) } })
      ]);

      setOrderStats({ total: ordersRes.data.totalOrders, trend: ordersRes.data.trend });
      setSalesStats({ total: salesRes.data.totalSales, trend: salesRes.data.trend });
      setClientStats({ total: clientsRes.data.totalClients, trend: clientsRes.data.trend });
      setTopProducts(topProductsRes.data);
    } catch (err) {
      console.error("Fetch Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async (isLoadMore = false) => {
    if (loadingMore || (!isLoadMore && allProducts.length > 0)) {
      if (!isLoadMore && allProducts.length > 0) setShowAllModal(true);
      return;
    }

    if (isLoadMore && !hasMore) return;

    setLoadingMore(true);
    try {
      const skip = isLoadMore ? allProductsSkip + 5 : 0;
      const params = {
        from: dateFrom.getTime(),
        to: dateTo.getTime(),
        limit: 5,
        skip: skip,
        status: JSON.stringify(["active", "archived"])
      };

      const { data } = await axios.get(`${backEndUrl}/getBestSellers`, { params });

      if (data && data.length > 0) {
        setAllProducts(prev => isLoadMore ? [...prev, ...data] : data);
        setAllProductsSkip(skip);
        setHasMore(data.length === 5);
      } else {
        setHasMore(false);
      }

      if (!isLoadMore) setShowAllModal(true);
    } catch (error) {
      console.error("Error fetching all products:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMetricPress = async (metricTitle: string) => {
    setLoadingMetric(true);
    setShowMetricModal(true);
    setMetricSkip(0);
    setMetricHasMore(true);
    setSelectedMetric({ title: metricTitle, data: [] });

    try {
      const { data, hasMore } = await fetchMetricBatch(metricTitle, 0);
      setSelectedMetric({ title: metricTitle, data: data || [] });
      setMetricHasMore(hasMore);
    } catch (error) {
      console.error("Metric Detail Error:", error);
    } finally {
      setLoadingMetric(false);
    }
  };

  const fetchMetricBatch = async (metricTitle: string, skip: number) => {
    const params = {
      from: dateFrom.getTime(),
      to: dateTo.getTime(),
      limit: 5,
      skip
    };

    let endpoint = '';
    let status = '';

    if (metricTitle === 'Total Sales' || metricTitle === 'Avg. Value') {
      endpoint = '/getDailySalesByDateRange';
    } else if (metricTitle === 'New Orders') {
      endpoint = '/getOrdersDetailsByDateRange';
      status = 'pending';
    } else if (metricTitle === 'New Clients') {
      endpoint = '/getClientsDetailsByDateRange';
    }

    const { data } = await axios.get(`${backEndUrl}${endpoint}`, {
      params: status ? { ...params, status } : params
    });

    return {
      data,
      hasMore: data && data.length === 5
    };
  };

  const fetchMoreMetricData = async () => {
    if (loadingMoreMetric || !metricHasMore || !selectedMetric) return;

    setLoadingMoreMetric(true);
    try {
      const nextSkip = metricSkip + 5;
      const { data, hasMore } = await fetchMetricBatch(selectedMetric.title, nextSkip);

      setSelectedMetric(prev => prev ? {
        ...prev,
        data: [...prev.data, ...data]
      } : null);

      setMetricSkip(nextSkip);
      setMetricHasMore(hasMore);
    } catch (error) {
      console.error("Error fetching more metric data:", error);
    } finally {
      setLoadingMoreMetric(false);
    }
  };

  const fetchStoreLaunchDate = async () => {
    try {
      const { data } = await axios.get(`${backEndUrl}/getOwnerInfo`);
      // The backend returns { ownerInfo: { ... } }
      if (data && data.ownerInfo && data.ownerInfo.createdAt) {
        setStoreLaunchDate(new Date(data.ownerInfo.createdAt));
      }
    } catch (err) {
      console.error("Error fetching store launch date:", err);
    }
  };

  useEffect(() => {
    fetchStoreLaunchDate();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateFrom, dateTo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    // بمجرد انتهاء الطلبات هنا، سيتحدث الـ Chart تلقائياً لأنه يراقب الـ refreshing prop
    setRefreshing(false);
  }, [dateFrom, dateTo]);

  const onChangeFrom = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowFrom(false);
    if (selectedDate) {
      setDateFrom(selectedDate);
      setActivePreset('custom');
    }
  };
  const onChangeTo = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTo(false);
    if (selectedDate) {
      setDateTo(selectedDate);
      setActivePreset('custom');
    }
  };

  const avgOrderValue = orderStats.total > 0
    ? (salesStats.total / orderStats.total).toFixed(2)
    : '0.00';

  const stats = [
    { id: 1, title: 'Total Sales', value: salesStats.total.toLocaleString('fr-FR'), icon: <DollarSign color="#4ADE80" size={24} />, trend: `${Number(salesStats.trend) >= 0 ? '+' : ''}${salesStats.trend}%`, link: '/orders/delivered' },
    { id: 2, title: 'New Orders', value: orderStats.total.toString(), icon: <ShoppingBag color="#3B82F6" size={24} />, trend: `${Number(orderStats.trend) >= 0 ? '+' : ''}${orderStats.trend}%`, link: '/orders/pending' },
    { id: 3, title: 'New Clients', value: clientStats.total.toString(), icon: <Users color="#A855F7" size={24} />, trend: `${Number(clientStats.trend) >= 0 ? '+' : ''}${clientStats.trend}%`, link: '/people/clientsList' },
    { id: 4, title: 'Avg. Value', value: avgOrderValue, icon: <Wallet color="#F59E0B" size={24} />, trend: '+0.0%', link: '/orders/delivered' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.dark[100]}
          />
        }
      >
        {/* Header & Date Selectors code... (يظل كما هو) */}
        <View className="mb-6 flex-row justify-between items-center">
          <Text className="text-3xl font-bold text-[#1a1a1a]">Analytics</Text>
          <View className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <Calendar color="black" size={20} />
          </View>
        </View>

        <View className="flex-row bg-white rounded-[25px] p-2 mb-2 border border-gray-100 shadow-sm">
          <TouchableOpacity onPress={() => setShowFrom(true)} className="flex-1 items-center py-2 border-r border-gray-50">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">From</Text>
            <Text className="font-bold text-[#1a1a1a]">{dateFrom.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTo(true)} className="flex-1 items-center py-2">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">To</Text>
            <Text className="font-bold text-[#1a1a1a]">{dateTo.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Quick Options UX Upgrade */}
        <View className="mb-6">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3 ml-1">Time Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {/* All Time */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (storeLaunchDate) {
                  setDateFrom(storeLaunchDate);
                  setDateTo(new Date());
                  setActivePreset('all');
                } else {
                  // Fallback if store launch date isn't loaded yet
                  setDateFrom(new Date(2020, 0, 1));
                  setDateTo(new Date());
                  setActivePreset('all');
                }
              }}
              className={`px-5 py-3 rounded-2xl border shadow-sm flex-row items-center mr-3 ${activePreset === 'all' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${activePreset === 'all' ? 'bg-orange-100' : 'bg-orange-50'}`}>
                <Calendar color="#f59e0b" size={14} />
              </View>
              <View>
                <Text className={`text-[9px] font-black uppercase ${activePreset === 'all' ? 'text-orange-400' : 'text-gray-400'}`}>All</Text>
                <Text className={`text-[11px] font-bold ${activePreset === 'all' ? 'text-orange-700' : 'text-black'}`}>Time</Text>
              </View>
            </TouchableOpacity>
            {/* Last Week */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 7);
                setDateFrom(from);
                setDateTo(to);
                setActivePreset('week');
              }}
              className={`px-5 py-3 rounded-2xl border shadow-sm flex-row items-center mr-3 ${activePreset === 'week' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${activePreset === 'week' ? 'bg-blue-100' : 'bg-blue-50'}`}>
                <Calendar color="#3b82f6" size={14} />
              </View>
              <View>
                <Text className={`text-[9px] font-black uppercase ${activePreset === 'week' ? 'text-blue-400' : 'text-gray-400'}`}>Last</Text>
                <Text className={`text-[11px] font-bold ${activePreset === 'week' ? 'text-blue-700' : 'text-black'}`}>Week</Text>
              </View>
            </TouchableOpacity>

            {/* Last 2 Weeks */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 14);
                setDateFrom(from);
                setDateTo(to);
                setActivePreset('2weeks');
              }}
              className={`px-5 py-3 rounded-2xl border shadow-sm flex-row items-center mr-3 ${activePreset === '2weeks' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${activePreset === '2weeks' ? 'bg-indigo-100' : 'bg-indigo-50'}`}>
                <Calendar color="#6366f1" size={14} />
              </View>
              <View>
                <Text className={`text-[9px] font-black uppercase ${activePreset === '2weeks' ? 'text-indigo-400' : 'text-gray-400'}`}>Last 2</Text>
                <Text className={`text-[11px] font-bold ${activePreset === '2weeks' ? 'text-indigo-700' : 'text-black'}`}>Weeks</Text>
              </View>
            </TouchableOpacity>

            {/* Last Month */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 30);
                setDateFrom(from);
                setDateTo(to);
                setActivePreset('month');
              }}
              className={`px-5 py-3 rounded-2xl border shadow-sm flex-row items-center mr-3 ${activePreset === 'month' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${activePreset === 'month' ? 'bg-purple-100' : 'bg-purple-50'}`}>
                <Calendar color="#a855f7" size={14} />
              </View>
              <View>
                <Text className={`text-[9px] font-black uppercase ${activePreset === 'month' ? 'text-purple-400' : 'text-gray-400'}`}>Last</Text>
                <Text className={`text-[11px] font-bold ${activePreset === 'month' ? 'text-purple-700' : 'text-black'}`}>Month</Text>
              </View>
            </TouchableOpacity>

            {/* Last Year */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 365);
                setDateFrom(from);
                setDateTo(to);
                setActivePreset('year');
              }}
              className={`px-5 py-3 rounded-2xl border shadow-sm flex-row items-center mr-3 ${activePreset === 'year' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'}`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${activePreset === 'year' ? 'bg-rose-100' : 'bg-rose-50'}`}>
                <Calendar color="#f43f5e" size={14} />
              </View>
              <View>
                <Text className={`text-[9px] font-black uppercase ${activePreset === 'year' ? 'text-rose-400' : 'text-gray-400'}`}>Last</Text>
                <Text className={`text-[11px] font-bold ${activePreset === 'year' ? 'text-rose-700' : 'text-black'}`}>Year</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {showFrom && <DateTimePicker value={dateFrom} mode="date" display="default" onChange={onChangeFrom} maximumDate={dateTo} />}
        {showTo && <DateTimePicker value={dateTo} mode="date" display="default" onChange={onChangeTo} minimumDate={dateFrom} maximumDate={new Date()} />}

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          {stats.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleMetricPress(item.title)}
              className="bg-white p-4 mb-4 rounded-3xl shadow-sm border border-gray-100"
              style={{ width: width * 0.43 }}
            >
              <View className="bg-gray-50 self-start p-2 rounded-2xl mb-3">{item.icon}</View>
              <Text className="text-gray-400 text-[11px] mb-1 font-semibold">{item.title}</Text>
              <Text className="text-xl font-bold text-[#1a1a1a]">
                {item.title.includes('Sales') || item.title.includes('Value') ? `${item.value} DT` : item.value}
              </Text>
              <Text className={`text-[10px] mt-1 font-bold ${item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {item.trend}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Component - Now with refreshing sync */}
        <ProfitsChartByDate
          dateFrom={dateFrom}
          dateTo={dateTo}
          refreshing={refreshing}
        />

        {/* Top Products Section */}
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text className="text-xl font-bold text-[#1a1a1a]">Top Products</Text>
          <TouchableOpacity onPress={() => fetchAllProducts()} className="flex-row items-center">
            <Text className="text-blue-500 font-semibold mr-1">View All</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-[35px] p-4 mb-10 border border-gray-100 shadow-sm">
          {topProducts.length > 0 ? (
            topProducts.map((product, i) => (
              <TouchableOpacity
                key={product._id}
                onPress={() => router.push({ pathname: '/screens/productDetails/[id]', params: { id: product._id } })}
                className={`flex-row items-center py-3 ${i !== topProducts.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {/* Thumbnail Image */}
                <View className="w-14 h-14 bg-gray-100 rounded-2xl mr-4 overflow-hidden border border-gray-50 items-center justify-center">
                  {product.image ? (
                    <Image
                      source={{ uri: `${product.image}` }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <ShoppingBag color="#CCC" size={24} />
                  )}
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className="font-bold text-gray-800 text-[15px]" numberOfLines={0.8}>
                    {product.name}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {product.totalSales} units delivered
                  </Text>
                </View>

                {/* Price/Revenue */}
                <View className="items-end">
                  <Text className="font-bold text-[#1a1a1a]">
                    {product.totalRevenue.toLocaleString()} DT
                  </Text>
                  <View className="bg-green-50 px-2 py-0.5 rounded-md mt-1">
                    <Text className="text-[9px] text-green-600 font-bold uppercase">Trending</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="py-12 items-center justify-center">
              <ShoppingBag color="#EEE" size={48} />
              <Text className="text-gray-400 mt-2 font-medium">No top products found</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* All Products Modal */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowAllModal(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableWithoutFeedback>
            <View style={{ height: '80%', backgroundColor: colors.light[100] }} className="rounded-t-[40px] shadow-2xl p-6">
              <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-6 self-center" />
              <Text className="text-2xl font-black text-black mb-6">Top Performers</Text>

              <FlatList
                data={allProducts}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setShowAllModal(false);
                      router.push({ pathname: '/screens/productDetails/[id]', params: { id: item._id } });
                    }}
                    className="flex-row items-center py-4 border-b border-gray-50"
                  >
                    <View className="w-16 h-16 bg-gray-100 rounded-2xl mr-4 overflow-hidden border border-gray-50">
                      {item.image ? (
                        <Image source={{ uri: item.image }} className="w-full h-full" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <ShoppingBag color="#CCC" size={24} />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-black text-[16px]">{item.name}</Text>
                      <Text className="text-gray-500 text-xs mt-1">{item.totalSales} Units Sold</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-black text-black">{item.totalRevenue.toLocaleString()} DT</Text>
                      <View className="bg-blue-50 px-2 py-0.5 rounded-md mt-1">
                        <Text className="text-[9px] text-blue-600 font-bold uppercase">Popular</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                onEndReached={() => fetchAllProducts(true)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? (
                  <View className="py-6">
                    <ActivityIndicator color="black" />
                  </View>
                ) : null}
              />
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Metric Details Modal */}
      <Modal
        visible={showMetricModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMetricModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMetricModal(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableWithoutFeedback>
            <View style={{ height: '85%', backgroundColor: '#F8F9FA' }} className="rounded-t-[40px] shadow-2xl p-6">
              <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-6 self-center" />

              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Metric Insights</Text>
                  <Text className="text-2xl font-black text-black">{selectedMetric?.title}</Text>
                </View>
                <View className="bg-white px-4 py-2 rounded-2xl border border-gray-100">
                  <Text className="text-xs font-bold text-gray-500">{selectedMetric?.data?.length || 0} Records</Text>
                </View>
              </View>

              {loadingMetric ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color="black" size="large" />
                  <Text className="text-gray-400 font-bold mt-4 tracking-widest text-[10px] uppercase">Digging through data...</Text>
                </View>
              ) : (
                <FlatList
                  data={selectedMetric?.data}
                  keyExtractor={(item, index) => item._id || index.toString()} // Added index as fallback for key
                  showsVerticalScrollIndicator={false}
                  onEndReached={fetchMoreMetricData}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={() =>
                    loadingMoreMetric ? <ActivityIndicator color="black" className="py-4" size="small" /> : null
                  }
                  ListEmptyComponent={
                    <View className="py-20 items-center justify-center">
                      <Text className="text-gray-400 font-medium">No records found for this period</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    if (selectedMetric?.title === 'Total Sales' || selectedMetric?.title === 'Avg. Value') {
                      const isSales = selectedMetric.title === 'Total Sales';
                      return (
                        <View className="bg-white p-5 rounded-[30px] mb-3 border border-gray-50 shadow-sm">
                          <View className="flex-row justify-between items-center mb-3">
                            <View className="bg-gray-50 px-3 py-1.5 rounded-xl">
                              <Text className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {new Date(item.timestamp).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <ShoppingBag size={12} color="#9ca3af" />
                              <Text className="text-[10px] font-bold text-gray-400 ml-1.5">{item.orderCount} Orders</Text>
                            </View>
                          </View>
                          <View className="flex-row justify-between items-end">
                            <View>
                              <Text className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">
                                {isSales ? 'Revenue Generated' : 'Order Average'}
                              </Text>
                              <Text className="text-xl font-black text-black">
                                {isSales ? `${item.totalSales.toLocaleString()} DT` : `${item.avgValue.toFixed(2)} DT`}
                              </Text>
                            </View>
                            <View className={`w-8 h-8 rounded-full items-center justify-center ${isSales ? 'bg-green-50' : 'bg-amber-50'}`}>
                              {isSales ? <DollarSign color="#10b981" size={16} /> : <Wallet color="#f59e0b" size={16} />}
                            </View>
                          </View>
                        </View>
                      );
                    }

                    if (selectedMetric?.title === 'New Clients') {
                      return (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setShowMetricModal(false);
                            router.push({ pathname: '/screens/clientDetails/[id]', params: { id: item._id } });
                          }}
                          className="bg-white p-4 rounded-3xl mb-3 border border-gray-50 shadow-sm flex-row items-center"
                        >
                          <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center mr-4">
                            <Users color="#A855F7" size={20} />
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-black">{item.fullName || 'Unknown'}</Text>
                            <Text className="text-gray-400 text-[10px] font-bold mt-0.5">{item.phone || 'No phone provided'}</Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-[10px] font-black text-gray-300 uppercase leading-none">Joined</Text>
                            <Text className="text-[11px] font-bold text-black mt-1">
                              {new Date(item.createdAt).toLocaleDateString('en-GB')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }

                    // Default view for Orders (New Orders)
                    const totalItems = item.purchases?.length || 0;

                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedOrder(item);
                          setIsOrderModalVisible(true);
                        }}
                        className="bg-white p-4 rounded-3xl mb-3 border border-gray-50 shadow-sm"
                      >
                        <View className="flex-row justify-between items-center mb-3">
                          <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2 bg-blue-50">
                              <ShoppingBag color="#3b82f6" size={14} />
                            </View>
                            <Text className="font-black text-black text-xs uppercase tracking-wider">#{item.orderNumber}</Text>
                          </View>
                          <Text className="text-[10px] font-bold text-gray-400 italic">{new Date(item.createdAt).toLocaleDateString('en-GB')}</Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="flex-1">
                            <Text className="font-bold text-black text-sm" numberOfLines={1}>{item.fullName || item.client?.fullName}</Text>
                            <Text className="text-gray-400 text-xs mt-0.5 font-medium">{totalItems} {totalItems === 1 ? 'Product' : 'Products'}</Text>
                          </View>
                          <Text className="text-md font-black text-black">{item.totalPrice?.toLocaleString()} DT</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <OrderDetailsModal
        isVisible={isOrderModalVisible}
        onClose={() => setIsOrderModalVisible(false)}
        order={selectedOrder}
        onUpdateSuccess={() => {
          fetchAnalyticsData();
        }}
      />
    </SafeAreaView>
  );
};

export default Analytics;