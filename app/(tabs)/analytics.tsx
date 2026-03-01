import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, RefreshControl, Platform, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, ShoppingBag, DollarSign, Calendar, Wallet } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ProfitsChartByDate from '@/components/sub/charts/profitsByDate';
import axios from 'axios';
import { backEndUrl } from '@/api';
import { colors } from '@/constants';

const { width } = Dimensions.get('window');

type TopProduct = {
  _id: string;
  name: string;
  image: string;
  totalSales: number;
  totalRevenue: number;
};

const Analytics = () => {
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

  const fetchAnalyticsData = async () => {
    // لا نضع setLoading(true) إذا كنا في حالة refreshing لمنع تداخل المؤشرات
    if (!refreshing) setLoading(true); 
    try {
      const params = { from: dateFrom.getTime(), to: dateTo.getTime() };
      
      const [ordersRes, salesRes, clientsRes, topProductsRes] = await Promise.all([
        axios.get(`${backEndUrl}/getOrdersCountByDateRange`, { params }),
        axios.get(`${backEndUrl}/getTotalSalesByDateRange`, { params }),
        axios.get(`${backEndUrl}/getNewClientsCountByDateRange`, { params }),
        axios.get(`${backEndUrl}/getBestSellers`, { params: { ...params, limit: 3 } })
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

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateFrom, dateTo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    // بمجرد انتهاء الطلبات هنا، سيتحدث الـ Chart تلقائياً لأنه يراقب الـ refreshing prop
    setRefreshing(false);
  }, [dateFrom, dateTo]);

  const avgOrderValue = orderStats.total > 0 
    ? (salesStats.total / orderStats.total).toFixed(2) 
    : '0.00';

  const stats = [
    { id: 1, title: 'Total Sales', value: salesStats.total.toLocaleString('fr-FR'), icon: <DollarSign color="#4ADE80" size={24} />, trend: `${Number(salesStats.trend) >= 0 ? '+' : ''}${salesStats.trend}%` },
    { id: 2, title: 'New Orders', value: orderStats.total.toString(), icon: <ShoppingBag color="#3B82F6" size={24} />, trend: `${Number(orderStats.trend) >= 0 ? '+' : ''}${orderStats.trend}%` },
    { id: 3, title: 'New Clients', value: clientStats.total.toString(), icon: <Users color="#A855F7" size={24} />, trend: `${Number(clientStats.trend) >= 0 ? '+' : ''}${clientStats.trend}%` },
    { id: 4, title: 'Avg. Value', value: avgOrderValue, icon: <Wallet color="#F59E0B" size={24} />, trend: '+0.0%' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView
        className="flex-1 p-5"
        contentContainerStyle={{ paddingBottom: 100 }}
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

        <View className="flex-row bg-white rounded-[25px] p-2 mb-6 border border-gray-100 shadow-sm">
          <TouchableOpacity onPress={() => setShowFrom(true)} className="flex-1 items-center py-2 border-r border-gray-50">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">From</Text>
            <Text className="font-bold text-[#1a1a1a]">{dateFrom.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowTo(true)} className="flex-1 items-center py-2">
            <Text className="text-gray-400 text-[10px] font-bold uppercase">To</Text>
            <Text className="font-bold text-[#1a1a1a]">{dateTo.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>
        </View>

        {showFrom && <DateTimePicker value={dateFrom} mode="date" display="default" onChange={(e, d) => { setShowFrom(false); if(d) setDateFrom(d); }} maximumDate={dateTo} />}
        {showTo && <DateTimePicker value={dateTo} mode="date" display="default" onChange={(e, d) => { setShowTo(false); if(d) setDateTo(d); }} minimumDate={dateFrom} maximumDate={new Date()} />}

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between">
          {stats.map((item) => (
            <View key={item.id} className="bg-white p-4 mb-4 rounded-3xl shadow-sm border border-gray-100" style={{ width: width * 0.43 }}>
              <View className="bg-gray-50 self-start p-2 rounded-2xl mb-3">{item.icon}</View>
              <Text className="text-gray-400 text-[11px] mb-1 font-semibold">{item.title}</Text>
              <Text className="text-xl font-bold text-[#1a1a1a]">
                {item.title.includes('Sales') || item.title.includes('Value') ? `${item.value} DT` : item.value}
              </Text>
              <Text className={`text-[10px] mt-1 font-bold ${item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {item.trend}
              </Text>
            </View>
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
          {/* <TouchableOpacity className="flex-row items-center">
            <Text className="text-blue-500 font-semibold mr-1">View All</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </TouchableOpacity> */}
        </View>

        <View className="bg-white rounded-[35px] p-4 mb-10 border border-gray-100 shadow-sm">
          {topProducts.length > 0 ? (
            topProducts.map((product, i) => (
              <View key={product._id} className={`flex-row items-center py-3 ${i !== topProducts.length - 1 ? 'border-b border-gray-50' : ''}`}>
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
              </View>
            ))
          ) : (
            <View className="py-12 items-center justify-center">
              <ShoppingBag color="#EEE" size={48} />
              <Text className="text-gray-400 mt-2 font-medium">No top products found</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Analytics;